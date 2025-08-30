import TruckRouteMap from "@/components/custom/TruckRouteMap";

export default function Home() {
  const stops = [
    { lat: 40.708751, lng: -74.0918 }, // Start
    { lat: 40.413811, lng: -80.153814 }, // Stop 1
    // Add more stops here
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Truck Route</h1>
      <TruckRouteMap stops={stops} />
    </div>
  );
}
