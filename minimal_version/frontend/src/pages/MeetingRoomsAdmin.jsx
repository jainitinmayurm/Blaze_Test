import { useState, useEffect } from 'react';
import api from '../api';

export default function MeetingRoomsAdmin() {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', equipment: '' });

  useEffect(() => {
    api.get('/rooms').then((res) => setRooms(res.data));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const res = await api.post('/rooms', newRoom);
    setRooms([...rooms, res.data]);
    setNewRoom({ name: '', capacity: '', equipment: '' });
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">6. Meeting Rooms (Admin)</h2>
      
      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input className="border p-2" placeholder="Name" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} required />
        <input className="border p-2 w-24" type="number" placeholder="Cap" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} required />
        <input className="border p-2 flex-1" placeholder="Equipment" value={newRoom.equipment} onChange={e => setNewRoom({...newRoom, equipment: e.target.value})} />
        <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700">Add Room</button>
      </form>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Capacity</th>
            <th className="p-2 border">Equipment</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map(r => (
            <tr key={r.id}>
              <td className="p-2 border">{r.id}</td>
              <td className="p-2 border">{r.name}</td>
              <td className="p-2 border">{r.capacity}</td>
              <td className="p-2 border">{r.equipment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
