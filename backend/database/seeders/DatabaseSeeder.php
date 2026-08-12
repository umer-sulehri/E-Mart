<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Create categories
        $categories = [
            ['name' => 'Electronics', 'emoji' => '📱'],
            ['name' => 'Clothing', 'emoji' => '👕'],
            ['name' => 'Home & Garden', 'emoji' => '🏠'],
            ['name' => 'Books', 'emoji' => '📚'],
            ['name' => 'Beauty', 'emoji' => '💄'],
            ['name' => 'Sports', 'emoji' => '⚽'],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }

        // Create products
        $products = [
            ['name' => 'Wireless Headphones', 'price' => 99.99, 'category_id' => 1, 'description' => 'Premium wireless headphones with noise cancellation'],
            ['name' => 'Smart Watch', 'price' => 199.99, 'category_id' => 1, 'description' => 'Track your fitness and stay connected'],
            ['name' => 'Cotton T-Shirt', 'price' => 29.99, 'category_id' => 2, 'description' => 'Comfortable 100% organic cotton t-shirt'],
            ['name' => 'Classic Jeans', 'price' => 59.99, 'category_id' => 2, 'description' => 'Classic denim jeans for everyday wear'],
            ['name' => 'Ceramic Plant Pot', 'price' => 24.99, 'category_id' => 3, 'description' => 'Beautiful ceramic plant pot for your plants'],
            ['name' => 'Garden Tools Set', 'price' => 49.99, 'category_id' => 3, 'description' => 'Complete set of professional garden tools'],
            ['name' => 'Programming Guide', 'price' => 39.99, 'category_id' => 4, 'description' => 'Learn programming with this comprehensive guide'],
            ['name' => 'Mystery Novel', 'price' => 19.99, 'category_id' => 4, 'description' => 'Engaging mystery novel for book lovers'],
            ['name' => 'Organic Face Cream', 'price' => 34.99, 'category_id' => 5, 'description' => 'Natural face cream for glowing skin'],
            ['name' => 'Herbal Shampoo', 'price' => 24.99, 'category_id' => 5, 'description' => 'Natural shampoo for healthy, shiny hair'],
            ['name' => 'Eco Yoga Mat', 'price' => 29.99, 'category_id' => 6, 'description' => 'Eco-friendly yoga mat for your practice'],
            ['name' => 'Adjustable Dumbbells', 'price' => 79.99, 'category_id' => 6, 'description' => 'Adjustable dumbbell set for home gym'],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}