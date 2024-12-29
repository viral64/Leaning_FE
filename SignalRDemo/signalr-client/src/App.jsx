import { useEffect, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import axios from "axios";

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
      alert("Please select a product and enter a valid bid amount.");
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
      alert(response.data); // Display success message

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
      alert(error.response?.data || "An error occurred while placing the bid.");
    }
  };

  return (
    <div>
      <h1>Bid App</h1>

      {/* Notification */}
      <div>
        <h2>Notifications</h2>
        <ul>
          {Notifications.map((notification, index) => (
            <li key={index}>{notification}</li>
          ))}
        </ul>
      </div>

      {/* Product List */}
      <div>
        <h2>Products</h2>
        <ul>
          {products.map((product) => (
            <li
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              style={{
                cursor: "pointer",
                fontWeight:
                  selectedProduct?.id === product.id ? "bold" : "normal",
              }}
            >
              {product.title} - Current Bid: {product.currentBid}
            </li>
          ))}
        </ul>
      </div>

      {/* Place Bid */}
      <div>
        <h2>Place Bid</h2>
        {selectedProduct ? (
          <div>
            <p>
              Selected Product: <strong>{selectedProduct.title}</strong>
            </p>
            <p>Current Bid: {selectedProduct.currentBid}</p>
            <input
              type="number"
              step="0.01"
              placeholder="Enter your bid"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <button onClick={placeBid}>Place Bid</button>
          </div>
        ) : (
          <p>Please select a product to place a bid.</p>
        )}
      </div>
    </div>
  );
};

export default BidApp;
