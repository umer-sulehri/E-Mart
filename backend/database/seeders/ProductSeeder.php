<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    public function run()
    {
        $products = [
            [
                'name' => 'Smartphone X',
                'description' => 'Latest smartphone with amazing features',
                'price' => 599.99,
                'compare_price' => 699.99,
                'stock_quantity' => 50,
                'sku' => 'PHONE-001',
                'images' => json_encode(['phone1.jpg', 'phone2.jpg']),
                'category_id' => 1,
                'is_featured' => true,
                'attributes' => json_encode(['color' => 'Black', 'storage' => '128GB'])
            ],
            [
                'name' => 'Laptop Pro',
                'description' => 'High-performance laptop for professionals',
                'price' => 1299.99,
                'compare_price' => 1499.99,
                'stock_quantity' => 30,
                'sku' => 'LAPTOP-001',
                'images' => json_encode(['laptop1.jpg']),
                'category_id' => 1,
                'is_featured' => true,
                'attributes' => json_encode(['ram' => '16GB', 'storage' => '512GB SSD'])
            ],
            [
                'name' => 'T-Shirt Classic',
                'description' => 'Comfortable cotton t-shirt',
                'price' => 19.99,
                'compare_price' => null,
                'stock_quantity' => 100,
                'sku' => 'TSHIRT-001',
                'images' => json_encode(['tshirt1.jpg']),
                'category_id' => 2,
                'is_featured' => false,
                'attributes' => json_encode(['size' => 'M', 'color' => 'Blue'])
            ],
            [
                'name' => 'Programming Guide',
                'description' => 'Complete guide to programming',
                'price' => 39.99,
                'compare_price' => 49.99,
                'stock_quantity' => 75,
                'sku' => 'BOOK-001',
                'images' => json_encode(['book1.jpg']),
                'category_id' => 3,
                'is_featured' => true,
                'attributes' => json_encode(['author' => 'John Doe', 'pages' => '400'])
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}