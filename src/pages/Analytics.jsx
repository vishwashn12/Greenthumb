
import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const Analytics = () => {
  const db = getDatabase();
  
  // IoT Data States
  const [moisture, setMoisture] = useState(0);
  const [temperature, setTemperature] = useState(-10);
  const [humidity, setHumidity] = useState(0);
  const [pumpStatus, setPumpStatus] = useState(false);
  const [pumpTrigger, setPumpTrigger] = useState(30);

  // Graph Data States
  const [moistureData, setMoistureData] = useState([]);
  const [timeLabels, setTimeLabels] = useState([]);
  const [selectedRange, setSelectedRange] = useState("1H");

  useEffect(() => {
    // Set up real-time listener for database updates
    const monitorRef = ref(db, "monitor");
    const unsubscribe = onValue(monitorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const currentTime = new Date().toISOString();
        
        // Update current values directly from Firebase
        setMoisture(data.SoilMoisture);
        setTemperature(data.temp);
        setHumidity(data.humidity);
        setPumpStatus(data.pumpStatus); // Use pumpStatus from Firebase

        // Update historical data for the graph
        setMoistureData(prev => [...prev, { 
          time: currentTime, 
          value: data.SoilMoisture 
        }]);
        setTimeLabels(prev => [...prev, currentTime]);
      }
    });

    // Cleanup function
    return () => unsubscribe();
  }, [db]); // Removed pumpTrigger dependency since we're using Firebase value

  // Filter Data Based on Selected Time Range
  const getFilteredData = () => {
    const now = new Date();
    let filterTime = new Date();

    if (selectedRange === "1H") filterTime.setHours(now.getHours() - 1);
    else if (selectedRange === "1D") filterTime.setDate(now.getDate() - 1);
    else if (selectedRange === "7D") filterTime.setDate(now.getDate() - 7);
    else if (selectedRange === "15D") filterTime.setDate(now.getDate() - 15);

    return moistureData.filter((data) => new Date(data.time) >= filterTime);
  };

  const filteredData = getFilteredData();

  // Graph Data
  const lineData = {
    labels: filteredData.map((d) => new Date(d.time).toLocaleTimeString()),
    datasets: [
      {
        label: "Moisture Level",
        data: filteredData.map((d) => d.value),
        borderColor: "#00d1b2",
        backgroundColor: "rgba(0, 209, 178, 0.2)",
        tension: 0.4,
        pointRadius: 3,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: "rgba(0, 255, 0, 0.5)",
          lineWidth: 1,
        },
        ticks: {
          color: "#fff",
        },
      },
      y: {
        grid: {
          color: "rgba(0, 255, 0, 0.5)",
          lineWidth: 1,
        },
        ticks: {
          color: "#fff",
        },
      },
    },
  };

  return (
    <>
    <Navbar/>

    <div className="bg-black/30 backdrop-blur-md text-white min-h-screen m-10 mb-0 p-6">
      <h1 className="text-4xl ml-2 mb-4 font-smooch">IoT Sensor Dashboard</h1>

      {/* First Row: Moisture Level Chart */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 font-smooch">
        <h3 className="mb-2 text-2xl">Moisture Level</h3>
        <div className="flex space-x-4 mb-4 mt-4">
          {["1H", "1D", "7D", "15D"].map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-4 py-2 rounded ${
                selectedRange === range ? "bg-emerald-500" : "bg-gray-700"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="h-64">
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Second Row: Moisture, Temperature, Humidity, Pump Status, Pump Trigger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 font-smooch">
        {/* Moisture Gauge */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-2xl mb-2">Moisture</h3>
          <Doughnut
            data={{
              datasets: [
                {
                  data: [moisture, 100 - moisture],
                  backgroundColor: ["#00d1b2", "#444"],
                },
              ],
            }}
          />
          <p className="text-center text-xl mt-2">{moisture}%</p>
        </div>

        {/* Temperature Gauge */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md font-smooch">
          <h3 className="text-2xl mb-2">Temperature</h3>
          <Doughnut
            data={{
              datasets: [
                {
                  data: [temperature, 50 - temperature],
                  backgroundColor: ["#ffcc00", "#444"],
                },
              ],
            }}
          />
          <p className="text-center text-xl mt-2">{temperature}°C</p>
        </div>

        {/* Humidity Gauge */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md font-smooch">
          <h3 className="text-2xl mb-2">Humidity</h3>
          <Doughnut
            data={{
              datasets: [
                {
                  data: [humidity, 100 - humidity],
                  backgroundColor: ["#00aaff", "#444"],
                },
              ],
            }}
          />
          <p className="text-center text-xl mt-2">{humidity}%</p>
        </div>

        {/* Pump Status */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md font-smooch">
          <h3 className="text-2xl mb-16">Pump Status</h3>
          <div
            className={`w-24 h-24 mx-auto rounded-full ${
              pumpStatus ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <p className="text-center text-xl mt-2">{pumpStatus ? "ON" : "OFF"}</p>
        </div>

        {/* Pump Trigger Level */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md font-smooch">
          <h3 className="text-2xl mb-24">Threshold Level</h3>
          <p className="text-center text-xl mt-2">{pumpTrigger}%</p>
        </div>
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default Analytics;  