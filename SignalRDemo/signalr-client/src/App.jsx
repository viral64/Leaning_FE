import { useEffect, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import axios from "axios";
import Swal from "sweetalert2"; // Import SweetAlert2

const BidApp = () => {
  const [connection, setConnection] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [Notifications, setNotifications] = useState([]);

  // Establish SignalR connection and fetch product data
  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl("https://localhost:7111/messageHub") // Adjust URL as needed
      .withAutomaticReconnect()
      .build();

    newConnection
      .start()
      .then(() => console.log("SignalR Connected"))
      .catch((err) => console.error("Connection failed: ", err));

    newConnection.on("ReceiveNotification", (notificationMessage) => {
      setNotifications((prevNotifications) => [
        ...prevNotifications,
        notificationMessage,
      ]);
    });

    setConnection(newConnection);

    // Fetch products from API
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "https://localhost:7111/api/ProductOffer/getProducts"
        );
        console.log(response.data);
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, []);

  // Handle bid submission
  const placeBid = async () => {
    if (!selectedProduct || bidAmount.trim() === "") {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please select a product and enter a valid bid amount.',
      });
      return;
    }

    try {
      const response = await axios.post(
        "https://localhost:7111/api/ProductOffer/placeBid",
        {
          productId: selectedProduct.id,
          bidAmount: `$${bidAmount}`,
        }
      );
      Swal.fire({
        icon: 'success',
        title: 'Bid placed!',
        text: response.data,
      });

      // Update the local product list with the new bid amount
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === selectedProduct.id
            ? { ...product, currentBid: `$${bidAmount}` }
            : product
        )
      );

      // Update the selected product's current bid
      setSelectedProduct((prevProduct) => ({
        ...prevProduct,
        currentBid: `$${bidAmount}`,
      }));

      setBidAmount(""); // Clear bid input
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Something went wrong!',
        text: error.response?.data || "An error occurred while placing the bid.",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-center text-4xl font-bold mb-8">Bid App</h1>

      {/* Notification */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
        <ul className="space-y-2">
          {Notifications.map((notification, index) => (
            <li
              key={index}
              className="p-4 bg-blue-100 text-blue-800 rounded-lg shadow-sm"
            >
              {notification}
            </li>
          ))}
        </ul>
      </div>

      {/* Product List */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <ul className="space-y-2">
          {products.map((product) => (
            <li
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition ${
                selectedProduct?.id === product.id
                  ? "bg-gray-200 font-semibold"
                  : ""
              }`}
            >
              {product.title} - Current Bid: {product.currentBid}
            </li>
          ))}
        </ul>
      </div>

      {/* Place Bid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Place Bid</h2>
        {selectedProduct ? (
          <div className="p-6 border rounded-lg shadow-md">
            <p className="mb-4">
              <strong className="text-lg">Selected Product: </strong>
              {selectedProduct.title}
            </p>
            <p className="mb-4">
              <strong className="text-lg">Current Bid: </strong>
              {selectedProduct.currentBid}
            </p>
            <input
              type="number"
              step="0.01"
              placeholder="Enter your bid"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
            />
            <button
              onClick={placeBid}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
            >
              Place Bid
            </button>
          </div>
        ) : (
          <p className="text-gray-500 mt-4">Please select a product to place a bid.</p>
        )}
      </div>
    </div>
  );
};

export default BidApp;
