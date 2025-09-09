import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function EPrintPurchaseHistory() {
  const router = useRouter();
  const { ePrintPurchaseId, ePrintPurchaseUUID } = router.query;
  const [purchaseData, setPurchaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ePrintPurchaseId && ePrintPurchaseUUID) {
      fetchPurchaseHistory();
    }
  }, [ePrintPurchaseId, ePrintPurchaseUUID]);

  const fetchPurchaseHistory = async () => {
    try {
      const response = await fetch(`/api/purchase-history/verify?purchaseId=${ePrintPurchaseId}&purchaseUUID=${ePrintPurchaseUUID}`);
      
      if (response.ok) {
        const data = await response.json();
        setPurchaseData(data);
      } else {
        setError('Purchase record not found or invalid.');
      }
    } catch (err) {
      setError('Error fetching purchase history.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading purchase history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ACA Publishing ePrint Purchase History</title>
        <meta name="description" content="Verify your sheet music purchase" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-blue-600">ACA Publishing</div>
              </div>
              <div className="text-sm text-gray-600">
                DELIVERING MUSIC SINCE 2024
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {purchaseData.product.title}
              </h1>
              <p className="text-lg text-gray-600">
                {purchaseData.product.composer}
                <span className="ml-4 text-sm bg-gray-100 px-2 py-1 rounded">
                  {purchaseData.product.arrangement}
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ACA Publishing • Product ID: {purchaseData.product._id}
              </p>
            </div>

            {/* Purchase Details */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buyer:</span>
                    <span className="font-medium">{purchaseData.buyerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Choir Name:</span>
                    <span className="font-medium">{purchaseData.choirName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purchase Date:</span>
                    <span className="font-medium">{formatDate(purchaseData.purchaseDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{purchaseData.quantity} copies</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{purchaseData.purchaseId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium text-sm">{purchaseData.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">
                      {purchaseData.isDelivered ? 'Delivered' : 'Processing'}
                    </span>
                  </div>
                  {purchaseData.deliveredAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivered:</span>
                      <span className="font-medium">{formatDate(purchaseData.deliveredAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* License Information */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">License Information</h3>
              <p className="text-blue-800">
                Izin Penggunaan Lagu ini diberikan kepada Paduan Suara '{purchaseData.choirName}' 
                melalui '{purchaseData.buyerName}' pada tanggal {formatDate(purchaseData.purchaseDate)}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                This license is valid for {purchaseData.quantity} copies for the specified choir only.
              </p>
            </div>

            {/* Verification */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>This purchase has been verified and is authentic.</p>
              <p>Verification ID: {purchaseData.purchaseUUID}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t mt-12">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">
                Need help? We're Here. | 
                <a href="mailto:support@acapublishing.com" className="text-blue-600 hover:underline ml-1">
                  support@acapublishing.com
                </a>
              </p>
              <p>
                Copyright © 2024 ACA Publishing. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}