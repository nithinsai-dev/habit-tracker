import { useState, useEffect } from 'react'
import axios from 'axios'
import Habit from './Habit.jsx'

function App() {
  const [habits, setHabits] = useState([])
  const [name, setName] = useState('')

  useEffect(() => {
    axios.get('http://localhost:3000/api/habits')
      .then(res => setHabits(res.data))
  }, [])

  const addHabit = () => {
    axios.post('http://localhost:3000/api/habits', { name })
      .then(res => setHabits([...habits, res.data]))
    setName('')
  }

  return (
    <div>
      <h1>Habit Tracker</h1>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Enter habit"
      />
      <button onClick={addHabit}>Add</button>

      {habits.map(habit => (
        <Habit key={habit._id} name={habit.name} />
      ))}
    </div>
  )
}

export default App