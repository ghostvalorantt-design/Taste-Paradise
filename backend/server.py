from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Taste Paradise API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class OrderStatus(str, Enum):
    PENDING = "pending"
    COOKING = "cooking"
    READY = "ready"
    SERVED = "served"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"

class PaymentMethod(str, Enum):
    CASH = "cash"
    ONLINE = "online"

class KitchenStatus(str, Enum):
    ACTIVE = "active"
    BUSY = "busy"
    OFFLINE = "offline"

class TableStatus(str, Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    CLEANING = "cleaning"

# Models
class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    price: float
    category: str
    image_url: Optional[str] = None
    is_available: bool = True
    preparation_time: int = 15  # in minutes
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MenuItemCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    category: str
    image_url: Optional[str] = None
    preparation_time: int = 15

class OrderItem(BaseModel):
    menu_item_id: str
    menu_item_name: str
    quantity: int
    price: float
    special_instructions: str = ""

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str = ""
    table_number: Optional[str] = None
    items: List[OrderItem]
    total_amount: float
    status: OrderStatus = OrderStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    payment_method: Optional[PaymentMethod] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    estimated_completion: Optional[datetime] = None
    kot_generated: bool = False

class OrderCreate(BaseModel):
    customer_name: str = ""
    table_number: Optional[str] = None
    items: List[OrderItem]

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None

class KOT(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    order_number: str
    table_number: Optional[str] = None
    items: List[OrderItem]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: OrderStatus = OrderStatus.PENDING

class DashboardStats(BaseModel):
    today_orders: int
    today_revenue: float
    pending_orders: int
    cooking_orders: int
    ready_orders: int
    served_orders: int
    kitchen_status: KitchenStatus
    pending_payments: int

class RestaurantTable(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table_number: str
    capacity: int = 4
    status: TableStatus = TableStatus.AVAILABLE
    current_order_id: Optional[str] = None
    position_x: int = 0  # For layout positioning
    position_y: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TableCreate(BaseModel):
    table_number: str
    capacity: int = 4
    position_x: int = 0
    position_y: int = 0

class TableUpdate(BaseModel):
    status: Optional[TableStatus] = None
    current_order_id: Optional[str] = None

def prepare_for_mongo(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert datetime objects to ISO strings for MongoDB storage"""
    for key, value in data.items():
        if isinstance(value, datetime):
            data[key] = value.isoformat()
        elif isinstance(value, list):
            for i, item in enumerate(value):
                if isinstance(item, dict):
                    value[i] = prepare_for_mongo(item)
    return data

def parse_from_mongo(item: Dict[str, Any]) -> Dict[str, Any]:
    """Convert ISO strings back to datetime objects"""
    if '_id' in item:
        del item['_id']
    
    for key, value in item.items():
        if isinstance(value, str) and key.endswith(('_at', 'completion')):
            try:
                item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except:
                pass
        elif isinstance(value, list):
            for i, subitem in enumerate(value):
                if isinstance(subitem, dict):
                    value[i] = parse_from_mongo(subitem)
    return item

# Menu Management Endpoints
@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(item: MenuItemCreate):
    menu_item = MenuItem(**item.dict())
    item_dict = prepare_for_mongo(menu_item.dict())
    await db.menu_items.insert_one(item_dict)
    return menu_item

@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    items = await db.menu_items.find().to_list(length=None)
    return [MenuItem(**parse_from_mongo(item)) for item in items]

@api_router.get("/menu/categories")
async def get_categories():
    categories = await db.menu_items.distinct("category")
    return {"categories": categories}

@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, update_data: MenuItemCreate):
    item_dict = update_data.dict()
    item_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.menu_items.update_one(
        {"id": item_id},
        {"$set": prepare_for_mongo(item_dict)}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    updated_item = await db.menu_items.find_one({"id": item_id})
    return MenuItem(**parse_from_mongo(updated_item))

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str):
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted successfully"}

# Order Management Endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Calculate total amount
    total_amount = sum(item.quantity * item.price for item in order_data.items)
    
    # Calculate estimated completion time
    max_prep_time = 30  # default max prep time
    for item in order_data.items:
        menu_item = await db.menu_items.find_one({"id": item.menu_item_id})
        if menu_item:
            max_prep_time = max(max_prep_time, menu_item.get('preparation_time', 15))
    
    estimated_completion = datetime.now(timezone.utc).replace(microsecond=0) + \
                          timedelta(minutes=max_prep_time)
    
    order = Order(
        **order_data.dict(),
        total_amount=total_amount,
        estimated_completion=estimated_completion
    )
    
    order_dict = prepare_for_mongo(order.dict())
    await db.orders.insert_one(order_dict)
    
    # If table number is provided, update the table status
    if order.table_number:
        await db.tables.update_one(
            {"table_number": order.table_number},
            {"$set": {"status": "occupied", "current_order_id": order.id}}
        )
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(status: Optional[OrderStatus] = None):
    filter_query = {}
    if status:
        filter_query["status"] = status
    
    orders = await db.orders.find(filter_query).sort("created_at", -1).to_list(length=None)
    return [Order(**parse_from_mongo(order)) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**parse_from_mongo(order))

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, update_data: OrderUpdate):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    updated_order = await db.orders.find_one({"id": order_id})
    return Order(**parse_from_mongo(updated_order))

# KOT Endpoints
@api_router.post("/kot/{order_id}", response_model=KOT)
async def generate_kot(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_obj = Order(**parse_from_mongo(order))
    
    # Generate KOT number
    kot_count = await db.kots.count_documents({}) + 1
    order_number = f"ORD-{kot_count:04d}"
    
    kot = KOT(
        order_id=order_id,
        order_number=order_number,
        table_number=order_obj.table_number,
        items=order_obj.items
    )
    
    kot_dict = prepare_for_mongo(kot.dict())
    await db.kots.insert_one(kot_dict)
    
    # Mark order as KOT generated
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"kot_generated": True}}
    )
    
    return kot

@api_router.get("/kot", response_model=List[KOT])
async def get_kots():
    kots = await db.kots.find().sort("created_at", -1).to_list(length=None)
    return [KOT(**parse_from_mongo(kot)) for kot in kots]

# Dashboard Endpoints
@api_router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats():
    # Today's date range
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59)
    
    # Today's orders
    today_orders = await db.orders.count_documents({
        "created_at": {
            "$gte": today_start.isoformat(),
            "$lte": today_end.isoformat()
        }
    })
    
    # Today's revenue
    today_revenue_pipeline = [
        {
            "$match": {
                "created_at": {
                    "$gte": today_start.isoformat(),
                    "$lte": today_end.isoformat()
                },
                "payment_status": "paid"
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": "$total_amount"}
            }
        }
    ]
    
    revenue_result = await db.orders.aggregate(today_revenue_pipeline).to_list(length=1)
    today_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Order status counts
    pending_orders = await db.orders.count_documents({"status": "pending"})
    cooking_orders = await db.orders.count_documents({"status": "cooking"})
    ready_orders = await db.orders.count_documents({"status": "ready"})
    served_orders = await db.orders.count_documents({
        "status": "served",
        "created_at": {
            "$gte": today_start.isoformat(),
            "$lte": today_end.isoformat()
        }
    })
    
    # Pending payments
    pending_payments = await db.orders.count_documents({"payment_status": "pending"})
    
    # Kitchen status logic
    kitchen_status = KitchenStatus.ACTIVE
    if cooking_orders > 5:
        kitchen_status = KitchenStatus.BUSY
    elif cooking_orders == 0 and pending_orders == 0:
        kitchen_status = KitchenStatus.OFFLINE
    
    return DashboardStats(
        today_orders=today_orders,
        today_revenue=today_revenue,
        pending_orders=pending_orders,
        cooking_orders=cooking_orders,
        ready_orders=ready_orders,
        served_orders=served_orders,
        kitchen_status=kitchen_status,
        pending_payments=pending_payments
    )

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Table Management Endpoints
@api_router.post("/tables", response_model=RestaurantTable)
async def create_table(table_data: TableCreate):
    table = RestaurantTable(**table_data.dict())
    table_dict = prepare_for_mongo(table.dict())
    await db.tables.insert_one(table_dict)
    return table

@api_router.get("/tables", response_model=List[RestaurantTable])
async def get_tables():
    tables = await db.tables.find().sort("table_number", 1).to_list(length=None)
    return [RestaurantTable(**parse_from_mongo(table)) for table in tables]

@api_router.put("/tables/{table_id}", response_model=RestaurantTable)
async def update_table(table_id: str, update_data: TableUpdate):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    result = await db.tables.update_one(
        {"id": table_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    
    updated_table = await db.tables.find_one({"id": table_id})
    return RestaurantTable(**parse_from_mongo(updated_table))

@api_router.get("/tables/{table_number}/orders")
async def get_table_orders(table_number: str):
    orders = await db.orders.find({"table_number": table_number}).sort("created_at", -1).to_list(length=None)
    return [Order(**parse_from_mongo(order)) for order in orders]

@api_router.post("/tables/{table_number}/assign-order/{order_id}")
async def assign_order_to_table(table_number: str, order_id: str):
    # Update table with current order
    table_result = await db.tables.update_one(
        {"table_number": table_number},
        {"$set": {"current_order_id": order_id, "status": "occupied"}}
    )
    
    # Update order with table number
    order_result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"table_number": table_number}}
    )
    
    if table_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    if order_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order assigned to table successfully"}

@api_router.post("/tables/{table_number}/clear")
async def clear_table(table_number: str):
    """Clear a table after payment is complete"""
    table_result = await db.tables.update_one(
        {"table_number": table_number},
        {"$set": {"status": "available", "current_order_id": None}}
    )
    
    if table_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    
    return {"message": "Table cleared successfully"}

@api_router.post("/tables/initialize-default")
async def initialize_default_tables():
    # Check if tables already exist
    existing_count = await db.tables.count_documents({})
    if existing_count > 0:
        return {"message": f"Tables already exist ({existing_count} tables)"}
    
    # Create default table layout (4 tables as shown in image)
    default_tables = [
        {"table_number": "T1", "capacity": 4, "position_x": 0, "position_y": 0},
        {"table_number": "T2", "capacity": 4, "position_x": 1, "position_y": 0},
        {"table_number": "T3", "capacity": 6, "position_x": 2, "position_y": 0},
        {"table_number": "T4", "capacity": 4, "position_x": 3, "position_y": 0},
        {"table_number": "T5", "capacity": 2, "position_x": 0, "position_y": 1},
        {"table_number": "T6", "capacity": 2, "position_x": 1, "position_y": 1},
    ]
    
    created_tables = []
    for table_data in default_tables:
        table = RestaurantTable(**table_data)
        table_dict = prepare_for_mongo(table.dict())
        await db.tables.insert_one(table_dict)
        created_tables.append(table)
    
    return {"message": f"Created {len(created_tables)} default tables", "tables": created_tables}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()