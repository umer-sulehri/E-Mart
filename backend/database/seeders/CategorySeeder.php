<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run()
    {
        $categories = [
            ['name' => 'Electronics', 'description' => 'Electronic devices and gadgets', 'slug' => 'electronics', 'is_active' => true],
            ['name' => 'Clothing', 'description' => 'Fashion and apparel', 'slug' => 'clothing', 'is_active' => true],
            ['name' => 'Books', 'description' => 'Books and publications', 'slug' => 'books', 'is_active' => true],
            ['name' => 'Home & Garden', 'description' => 'Home improvement and gardening', 'slug' => 'home-garden', 'is_active' => true],
            ['name' => 'Sports', 'description' => 'Sports equipment and accessories', 'slug' => 'sports', 'is_active' => true],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}