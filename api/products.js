// api/products.js - Serverless API endpoint
export default async function handler(req, res) {
    // Allow CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appoYDvbHFsSyU3K7';
        const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'aym7';
        
        if (!AIRTABLE_API_KEY) {
            throw new Error('AIRTABLE_API_KEY environment variable is not set');
        }

        const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`;
        
        console.log('Fetching from Airtable:', airtableUrl);
        
        const response = await fetch(airtableUrl, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        const products = [];
        
        for (const record of data.records || []) {
            const fields = record.fields || {};
            
            if (!fields['نام'] && !fields['Name'] && !fields['Product Name']) {
                continue;
            }
            
            let images = [];
            Object.keys(fields).forEach(fieldName => {
                const fieldValue = fields[fieldName];
                
                if (fieldName.toLowerCase().includes('image') ||
                    fieldName.toLowerCase().includes('photo') ||
                    fieldName.toLowerCase().includes('pic') ||
                    fieldName.toLowerCase().includes('تصویر') ||
                    fieldName.toLowerCase().includes('عکس')) {
                    
                    if (Array.isArray(fieldValue)) {
                        fieldValue.forEach(attachment => {
                            if (attachment && attachment.url) {
                                images.push(attachment.url);
                            }
                        });
                    }
                }
            });
            
            if (images.length === 0) {
                const emoji = getCategoryPlaceholder(fields['دسته‌بندی'] || fields['Category'] || 'عمومی');
                const productName = fields['نام'] || fields['Name'] || fields['Product Name'] || 'محصول';
                const placeholderUrl = `https://via.placeholder.com/400x300/3949ab/FFFFFF?text=${encodeURIComponent(emoji + ' ' + productName.substring(0, 15))}`;
                images.push(placeholderUrl);
            }
            
            const product = {
                id: record.id,
                name: fields['نام'] || fields['Name'] || fields['Product Name'] || 'محصول بدون نام',
                code: fields['کود'] || fields['Code'] || fields['Product Code'] || `CODE-${record.id.substring(0, 4)}`,
                description: fields['توضیح'] || fields['Description'] || fields['توضیحات'] || 'بدون توضیح',
                fullDescription: fields['توضیح کامل'] || fields['Full Description'] || fields['توضیحات کامل'] || 
                               fields['توضیح'] || fields['Description'] || fields['توضیحات'] || 'بدون توضیح',
                price: fields['قیمت'] || fields['Price'] || fields['قیمت (افغانی)'] || '0 افغانی',
                stock: parseInt(fields['موجودی'] || fields['Stock'] || fields['تعداد'] || 0),
                category: fields['دسته‌بندی'] || fields['Category'] || fields['دسته'] || 'عمومی',
                images: images
            };
            
            products.push(product);
        }
        
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        
        res.status(200).json({
            success: true,
            products: products,
            count: products.length,
            lastUpdated: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching products:', error);
        
        res.status(500).json({
            success: false,
            error: error.message,
            products: [],
            count: 0
        });
    }
}

function getCategoryPlaceholder(category) {
    const categoryEmojis = {
        'آرایشی و بهداشتی': '💄',
        'مراقبت مو': '🧴',
        'مراقبت پوست': '🧴',
        'بهداشتی': '🧼',
        'لوازم آرایشی': '💅',
        'عطر': '🌸',
        'کرم': '🧴',
        'شامپو': '🧴',
        'صابون': '🧼',
        'لوازم خانگی': '🏠',
        'لباس': '👕',
        'کفش': '👟',
        'اکسسوری': '👜',
        'لوازم الکترونیکی': '📱',
        'کتاب': '📚',
        'اسباب بازی': '🧸',
        'خوراکی': '🍎',
        'عمومی': '📦'
    };
    
    return categoryEmojis[category] || '📦';
}