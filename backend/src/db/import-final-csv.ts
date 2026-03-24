import mongoose from 'mongoose';
import fs from 'fs';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';
import path from 'path';
import Product from '../models/Product';
import Category from '../models/Category';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CSV_FILE_PATH = '/Users/tahminachoudhury/Desktop/asif/final csv.csv';

const runImport = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/express_distributors';
    console.log(`Connecting to MongoDB at ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Wipe existing products and categories since this is a clean re-import
    console.log('Clearing existing products and categories...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Database cleared.');

    const parser = fs.createReadStream(CSV_FILE_PATH).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    );

    let count = 0;
    let errCount = 0;

    const categoryCache = new Map<string, mongoose.Types.ObjectId>();

    for await (const row of parser) {
      try {
        let categoryName = 'General';
        let productName = row.name;

        // Parse format: CATEGORY:SUBCATEGORY:PRODUCT or CATEGORY:PRODUCT
        if (row.name && row.name.includes(':')) {
          const parts = row.name.split(':');
          categoryName = parts[0].trim();
          productName = parts[parts.length - 1].trim(); // Always take the last part as the product name
        }

        // 1. Resolve Category
        const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'general';
        let categoryId = categoryCache.get(categorySlug);

        if (!categoryId) {
          let category = await Category.findOne({ slug: categorySlug });
          if (!category) {
            category = await Category.create({
              name: categoryName,
              slug: categorySlug,
            });
            console.log(`Created Category: ${categoryName}`);
          }
          categoryId = category._id as mongoose.Types.ObjectId;
          categoryCache.set(categorySlug, categoryId);
        }

        // 2. Format product fields
        const textForImage = encodeURIComponent(productName.substring(0, 20) || 'Product');
        const imageUrl = row.image_url || `https://placehold.co/400x400/eeeeee/333333?text=${textForImage}`;

        const price = parseFloat(row.price) || 0;
        const costPrice = parseFloat(row.cost_price) || 0;
        
        const skuStr = row.sku ? String(row.sku).trim() : '';
        const sku = (skuStr && !skuStr.includes('E+')) ? skuStr : `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const barcodeStr = row.barcode ? String(row.barcode).trim() : '';
        const barcode = (barcodeStr && !barcodeStr.includes('E+')) ? barcodeStr : undefined;

        const pluStr = row.plu ? String(row.plu).trim() : '';
        const plu = (pluStr && !pluStr.includes('E+')) ? pluStr : undefined;

        const productSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `product-${Date.now()}`;

        const productData = {
          name: productName,
          slug: productSlug,
          description: row.description || '',
          product_type: 'inventory',
          price: price,
          cost_price: costPrice,
          category_id: categoryId,
          image_url: imageUrl,
          barcode: barcode,
          plu: plu,
          sku: sku,
          // If stock is 0, give them 10 so it shows on the website (since often 0 stock hides items)
          stock_quantity: parseInt(row.stock_quantity, 10) || 10,
          committed_quantity: 0,
          low_stock_threshold: parseInt(row.low_stock_threshold, 10) || 5,
          is_active: true, // Force active to ensure it shows
          tax_rate: parseFloat(row.tax_rate) || 0,
        };

        if (!productData.barcode) delete (productData as any).barcode;
        if (!productData.plu) delete (productData as any).plu;

        // Check if product exists by slug (in case of duplicate product names in the CSV)
        let product = await Product.findOne({ slug: productData.slug });
        if (product) {
            // If duplicate slug, append random string
            productData.slug = `${productData.slug}-${Math.floor(Math.random() * 10000)}`;
            await Product.create(productData);
        } else {
            await Product.create(productData);
        }

        count++;
        if (count % 100 === 0) {
          console.log(`Processed ${count} products...`);
        }
      } catch (err: any) {
        errCount++;
        console.error(`Error processing row containing ${row.name}: ${err.message}`);
      }
    }

    console.log('--- Import Complete ---');
    console.log(`Successfully imported/updated: ${count}`);
    console.log(`Errors skipped: ${errCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Fatal error during import:', error);
    process.exit(1);
  }
};

runImport();
