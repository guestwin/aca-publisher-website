import dbConnect from '../../lib/db';
import Transaction from '../../models/Transaction';
import Product from '../../models/Product';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'POST':
      try {
        const {
          buyerName,
          buyerEmail,
          buyerPhone,
          choirName,
          paymentMethod,
          items,
          totalAmount,
          status = 'pending'
        } = req.body;

        // Validasi input
        if (!buyerName || !buyerEmail || !buyerPhone || !choirName || !items || items.length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Data transaksi tidak lengkap' 
          });
        }

        // Validasi produk dan hitung total
        let calculatedTotal = 0;
        const validatedItems = [];

        for (const item of items) {
          const product = await Product.findById(item.productId);
          if (!product) {
            return res.status(400).json({ 
              success: false, 
              message: `Produk dengan ID ${item.productId} tidak ditemukan` 
            });
          }

          const itemTotal = product.price * item.quantity;
          calculatedTotal += itemTotal;

          validatedItems.push({
            productId: product._id,
            title: product.title,
            arrangement: product.arrangement,
            price: product.price,
            quantity: item.quantity,
            subtotal: itemTotal
          });
        }

        // Tambahkan pajak 11%
        const tax = calculatedTotal * 0.11;
        const finalTotal = calculatedTotal + tax;

        // Buat transaksi baru
        const transaction = await Transaction.create({
          buyerName,
          buyerEmail,
          buyerPhone,
          choirName,
          paymentMethod,
          items: validatedItems,
          subtotal: calculatedTotal,
          tax,
          totalAmount: finalTotal,
          status,
          createdAt: new Date()
        });

        res.status(201).json({ 
          success: true, 
          data: transaction,
          _id: transaction._id
        });
      } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(400).json({ 
          success: false, 
          message: 'Gagal membuat transaksi',
          error: error.message 
        });
      }
      break;

    case 'GET':
      try {
        const transactions = await Transaction.find({})
          .populate('items.productId')
          .sort({ createdAt: -1 });
        
        res.status(200).json({ 
          success: true, 
          data: transactions 
        });
      } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(400).json({ 
          success: false, 
          message: 'Gagal mengambil data transaksi',
          error: error.message 
        });
      }
      break;

    default:
      res.status(400).json({ 
        success: false, 
        message: 'Method tidak didukung' 
      });
      break;
  }
}