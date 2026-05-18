import { useState } from 'react';

export default function SlotPicker() {
  // We mock the slots here to keep things minimal.
  // In a real application, this would involve a complex API call to check user availability calendars.
  const [slots] = useState([
    { time: '10:00 AM', available: true },
    { time: '11:00 AM', available: false },
    { time: '01:00 PM', available: true },
    { time: '02:00 PM', available: true },
  ]);

  return (
    <div className="bg-white p-6 rounded shadow max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">3. Slot Picker</h2>
      <p className="mb-4 text-gray-600">Mock display of available slots for a given date/participants.</p>
      
      {/* CSS Grid is used here to create a 2-column layout for the slots */}
      <div className="grid grid-cols-2 gap-4">
        {slots.map((slot, i) => (
          // Dynamic classes: If a slot is available, make it green and clickable.
          // If it is NOT available, make it red, faded, and show a 'not-allowed' cursor.
          <div key={i} className={`p-4 rounded text-center font-semibold border ${slot.available ? 'bg-green-100 border-green-300 text-green-800 cursor-pointer hover:bg-green-200' : 'bg-red-100 border-red-300 text-red-800 cursor-not-allowed opacity-60'}`}>
            {slot.time} - {slot.available ? 'Available' : 'Booked'}
          </div>
        ))}
      </div>
    </div>
  );
}
