#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Taste Paradise Restaurant Management System
Tests all core endpoints: health, dashboard, menu, orders, and KOT functionality
"""

import requests
import json
import time
from datetime import datetime, timezone
from typing import Dict, List, Any

# Configuration
BASE_URL = "https://taste-paradise.preview.emergentagent.com/api"
TIMEOUT = 30

class RestaurantAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.test_results = []
        self.created_items = {
            'menu_items': [],
            'orders': [],
            'kots': []
        }
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_health_check(self):
        """Test the health check endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            
            if response.status_code == 200:
                data = response.json()
                if 'status' in data and data['status'] == 'healthy':
                    self.log_test("Health Check", True, "API is healthy and responding", data)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
        
        return False
    
    def test_menu_operations(self):
        """Test complete menu CRUD operations"""
        success_count = 0
        
        # Test 1: Create menu items
        menu_items = [
            {
                "name": "Butter Chicken",
                "description": "Creamy tomato-based curry with tender chicken pieces",
                "price": 320.0,
                "category": "Main Course",
                "preparation_time": 25
            },
            {
                "name": "Paneer Tikka Masala",
                "description": "Grilled cottage cheese in rich spiced gravy",
                "price": 280.0,
                "category": "Main Course", 
                "preparation_time": 20
            },
            {
                "name": "Garlic Naan",
                "description": "Fresh baked bread with garlic and herbs",
                "price": 80.0,
                "category": "Breads",
                "preparation_time": 10
            },
            {
                "name": "Mango Lassi",
                "description": "Refreshing yogurt drink with mango pulp",
                "price": 120.0,
                "category": "Beverages",
                "preparation_time": 5
            }
        ]
        
        for item_data in menu_items:
            try:
                response = self.session.post(f"{BASE_URL}/menu", json=item_data)
                if response.status_code == 200:
                    created_item = response.json()
                    self.created_items['menu_items'].append(created_item['id'])
                    self.log_test(f"Create Menu Item - {item_data['name']}", True, 
                                f"Created with ID: {created_item['id']}")
                    success_count += 1
                else:
                    self.log_test(f"Create Menu Item - {item_data['name']}", False, 
                                f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test(f"Create Menu Item - {item_data['name']}", False, f"Error: {str(e)}")
        
        # Test 2: Get all menu items
        try:
            response = self.session.get(f"{BASE_URL}/menu")
            if response.status_code == 200:
                menu_data = response.json()
                if isinstance(menu_data, list) and len(menu_data) >= len(menu_items):
                    self.log_test("Get Menu Items", True, 
                                f"Retrieved {len(menu_data)} menu items")
                    success_count += 1
                else:
                    self.log_test("Get Menu Items", False, 
                                f"Expected list with {len(menu_items)}+ items, got: {menu_data}")
            else:
                self.log_test("Get Menu Items", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Menu Items", False, f"Error: {str(e)}")
        
        # Test 3: Get categories
        try:
            response = self.session.get(f"{BASE_URL}/menu/categories")
            if response.status_code == 200:
                categories_data = response.json()
                if 'categories' in categories_data and isinstance(categories_data['categories'], list):
                    categories = categories_data['categories']
                    expected_categories = ["Main Course", "Breads", "Beverages"]
                    found_categories = [cat for cat in expected_categories if cat in categories]
                    if len(found_categories) >= 2:
                        self.log_test("Get Categories", True, 
                                    f"Found categories: {categories}")
                        success_count += 1
                    else:
                        self.log_test("Get Categories", False, 
                                    f"Missing expected categories. Found: {categories}")
                else:
                    self.log_test("Get Categories", False, f"Invalid response format: {categories_data}")
            else:
                self.log_test("Get Categories", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Categories", False, f"Error: {str(e)}")
        
        # Test 4: Update menu item
        if self.created_items['menu_items']:
            item_id = self.created_items['menu_items'][0]
            update_data = {
                "name": "Premium Butter Chicken",
                "description": "Creamy tomato-based curry with premium chicken pieces",
                "price": 380.0,
                "category": "Main Course",
                "preparation_time": 30
            }
            
            try:
                response = self.session.put(f"{BASE_URL}/menu/{item_id}", json=update_data)
                if response.status_code == 200:
                    updated_item = response.json()
                    if updated_item['name'] == "Premium Butter Chicken" and updated_item['price'] == 380.0:
                        self.log_test("Update Menu Item", True, 
                                    f"Successfully updated item {item_id}")
                        success_count += 1
                    else:
                        self.log_test("Update Menu Item", False, 
                                    f"Update didn't reflect properly: {updated_item}")
                else:
                    self.log_test("Update Menu Item", False, 
                                f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test("Update Menu Item", False, f"Error: {str(e)}")
        
        return success_count >= 4  # At least 4 out of 5 tests should pass
    
    def test_order_lifecycle(self):
        """Test complete order management lifecycle"""
        success_count = 0
        
        # Ensure we have menu items for orders
        if not self.created_items['menu_items']:
            self.log_test("Order Lifecycle", False, "No menu items available for order testing")
            return False
        
        # Test 1: Create order
        order_data = {
            "customer_name": "Rajesh Kumar",
            "table_number": "T-05",
            "items": [
                {
                    "menu_item_id": self.created_items['menu_items'][0],
                    "menu_item_name": "Premium Butter Chicken",
                    "quantity": 2,
                    "price": 380.0,
                    "special_instructions": "Medium spicy"
                },
                {
                    "menu_item_id": self.created_items['menu_items'][1] if len(self.created_items['menu_items']) > 1 else self.created_items['menu_items'][0],
                    "menu_item_name": "Paneer Tikka Masala",
                    "quantity": 1,
                    "price": 280.0,
                    "special_instructions": ""
                }
            ]
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/orders", json=order_data)
            if response.status_code == 200:
                created_order = response.json()
                order_id = created_order['id']
                self.created_items['orders'].append(order_id)
                
                # Verify order details
                expected_total = 380.0 * 2 + 280.0  # 1040.0
                if (created_order['total_amount'] == expected_total and 
                    created_order['customer_name'] == "Rajesh Kumar" and
                    created_order['status'] == "pending"):
                    self.log_test("Create Order", True, 
                                f"Order created with ID: {order_id}, Total: ₹{expected_total}")
                    success_count += 1
                else:
                    self.log_test("Create Order", False, 
                                f"Order details incorrect: {created_order}")
            else:
                self.log_test("Create Order", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Create Order", False, f"Error: {str(e)}")
            return False
        
        if not self.created_items['orders']:
            return False
            
        order_id = self.created_items['orders'][0]
        
        # Test 2: Get all orders
        try:
            response = self.session.get(f"{BASE_URL}/orders")
            if response.status_code == 200:
                orders = response.json()
                if isinstance(orders, list) and len(orders) > 0:
                    self.log_test("Get All Orders", True, f"Retrieved {len(orders)} orders")
                    success_count += 1
                else:
                    self.log_test("Get All Orders", False, f"Expected non-empty list, got: {orders}")
            else:
                self.log_test("Get All Orders", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get All Orders", False, f"Error: {str(e)}")
        
        # Test 3: Get specific order
        try:
            response = self.session.get(f"{BASE_URL}/orders/{order_id}")
            if response.status_code == 200:
                order = response.json()
                if order['id'] == order_id and order['customer_name'] == "Rajesh Kumar":
                    self.log_test("Get Specific Order", True, f"Retrieved order {order_id}")
                    success_count += 1
                else:
                    self.log_test("Get Specific Order", False, f"Order data mismatch: {order}")
            else:
                self.log_test("Get Specific Order", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Specific Order", False, f"Error: {str(e)}")
        
        # Test 4: Update order status (pending -> cooking -> ready -> served)
        status_transitions = [
            ("cooking", "Order moved to cooking"),
            ("ready", "Order ready for pickup"),
            ("served", "Order served to customer")
        ]
        
        for status, description in status_transitions:
            try:
                update_data = {"status": status}
                response = self.session.put(f"{BASE_URL}/orders/{order_id}", json=update_data)
                if response.status_code == 200:
                    updated_order = response.json()
                    if updated_order['status'] == status:
                        self.log_test(f"Update Order Status to {status}", True, description)
                        success_count += 1
                    else:
                        self.log_test(f"Update Order Status to {status}", False, 
                                    f"Status not updated properly: {updated_order['status']}")
                else:
                    self.log_test(f"Update Order Status to {status}", False, 
                                f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test(f"Update Order Status to {status}", False, f"Error: {str(e)}")
        
        # Test 5: Update payment status
        try:
            payment_data = {"payment_status": "paid", "payment_method": "online"}
            response = self.session.put(f"{BASE_URL}/orders/{order_id}", json=payment_data)
            if response.status_code == 200:
                updated_order = response.json()
                if (updated_order['payment_status'] == "paid" and 
                    updated_order['payment_method'] == "online"):
                    self.log_test("Update Payment Status", True, "Payment marked as paid via online")
                    success_count += 1
                else:
                    self.log_test("Update Payment Status", False, 
                                f"Payment update failed: {updated_order}")
            else:
                self.log_test("Update Payment Status", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Update Payment Status", False, f"Error: {str(e)}")
        
        return success_count >= 6  # At least 6 out of 7 tests should pass
    
    def test_kot_system(self):
        """Test KOT (Kitchen Order Ticket) generation and management"""
        success_count = 0
        
        if not self.created_items['orders']:
            self.log_test("KOT System", False, "No orders available for KOT testing")
            return False
        
        order_id = self.created_items['orders'][0]
        
        # Test 1: Generate KOT
        try:
            response = self.session.post(f"{BASE_URL}/kot/{order_id}")
            if response.status_code == 200:
                kot = response.json()
                kot_id = kot['id']
                self.created_items['kots'].append(kot_id)
                
                if (kot['order_id'] == order_id and 
                    'order_number' in kot and 
                    kot['order_number'].startswith('ORD-')):
                    self.log_test("Generate KOT", True, 
                                f"KOT generated: {kot['order_number']} for order {order_id}")
                    success_count += 1
                else:
                    self.log_test("Generate KOT", False, f"KOT data invalid: {kot}")
            else:
                self.log_test("Generate KOT", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Generate KOT", False, f"Error: {str(e)}")
        
        # Test 2: Get all KOTs
        try:
            response = self.session.get(f"{BASE_URL}/kot")
            if response.status_code == 200:
                kots = response.json()
                if isinstance(kots, list) and len(kots) > 0:
                    # Find our KOT in the list
                    our_kot = next((k for k in kots if k['order_id'] == order_id), None)
                    if our_kot:
                        self.log_test("Get All KOTs", True, 
                                    f"Retrieved {len(kots)} KOTs, found our KOT: {our_kot['order_number']}")
                        success_count += 1
                    else:
                        self.log_test("Get All KOTs", False, 
                                    f"Our KOT not found in list of {len(kots)} KOTs")
                else:
                    self.log_test("Get All KOTs", False, f"Expected non-empty list, got: {kots}")
            else:
                self.log_test("Get All KOTs", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get All KOTs", False, f"Error: {str(e)}")
        
        # Test 3: Verify order is marked as KOT generated
        try:
            response = self.session.get(f"{BASE_URL}/orders/{order_id}")
            if response.status_code == 200:
                order = response.json()
                if order.get('kot_generated', False):
                    self.log_test("Order KOT Flag", True, "Order correctly marked as KOT generated")
                    success_count += 1
                else:
                    self.log_test("Order KOT Flag", False, 
                                f"Order not marked as KOT generated: {order.get('kot_generated')}")
            else:
                self.log_test("Order KOT Flag", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Order KOT Flag", False, f"Error: {str(e)}")
        
        return success_count >= 2  # At least 2 out of 3 tests should pass
    
    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/dashboard")
            if response.status_code == 200:
                stats = response.json()
                
                # Verify all required fields are present
                required_fields = [
                    'today_orders', 'today_revenue', 'pending_orders', 
                    'cooking_orders', 'ready_orders', 'served_orders',
                    'kitchen_status', 'pending_payments'
                ]
                
                missing_fields = [field for field in required_fields if field not in stats]
                if not missing_fields:
                    # Verify data types
                    numeric_fields = ['today_orders', 'today_revenue', 'pending_orders', 
                                    'cooking_orders', 'ready_orders', 'served_orders', 'pending_payments']
                    
                    valid_types = all(isinstance(stats[field], (int, float)) for field in numeric_fields)
                    valid_kitchen_status = stats['kitchen_status'] in ['active', 'busy', 'offline']
                    
                    if valid_types and valid_kitchen_status:
                        self.log_test("Dashboard Stats", True, 
                                    f"Dashboard data: Orders: {stats['today_orders']}, "
                                    f"Revenue: ₹{stats['today_revenue']}, "
                                    f"Kitchen: {stats['kitchen_status']}")
                        return True
                    else:
                        self.log_test("Dashboard Stats", False, 
                                    f"Invalid data types or kitchen status: {stats}")
                else:
                    self.log_test("Dashboard Stats", False, 
                                f"Missing required fields: {missing_fields}")
            else:
                self.log_test("Dashboard Stats", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Dashboard Stats", False, f"Error: {str(e)}")
        
        return False
    
    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🍽️  Starting Taste Paradise Restaurant API Testing...")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Menu Operations", self.test_menu_operations),
            ("Order Lifecycle", self.test_order_lifecycle),
            ("KOT System", self.test_kot_system),
            ("Dashboard Stats", self.test_dashboard_stats)
        ]
        
        results = {}
        for test_name, test_func in tests:
            print(f"\n🧪 Testing {test_name}...")
            results[test_name] = test_func()
            time.sleep(1)  # Brief pause between test suites
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\nOverall Result: {passed}/{total} test suites passed")
        
        if passed == total:
            print("🎉 All backend API tests PASSED! Restaurant system is ready.")
        else:
            print("⚠️  Some tests FAILED. Check individual test details above.")
        
        return results

def main():
    """Main test execution"""
    tester = RestaurantAPITester()
    results = tester.run_comprehensive_test()
    
    # Return exit code based on results
    all_passed = all(results.values())
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())