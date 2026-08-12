<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Test route
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

// Get all products
Route::get('/products', [ProductController::class, 'index'
]);

// Get single product
Route::get('/products/{id}', [ProductController::class, 'show'
]);

// Get all categories
Route::get('/categories', [CategoryController::class, 'index'
]);

// Get products by category
Route::get('/categories/{id}/products', function ($id) {
    $products = Product::where('category_id', $id)->get();
    return response()->json($products);
});