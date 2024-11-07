
import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Sun, Cloud, CloudRain, Wind, Droplets, Loader2, Search, Thermometer, Sunrise, Sunset } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'


const API_KEY = '4a490c6d2fa17f6608c54fd00d012233'

function SetViewOnClick({ coords }) {
  const map = useMap()
  map.setView(coords, map.getZoom())
  return null
}

function LocationMarker({ setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  return null
}

const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
})

export default function WeatherApp() {
  const [weatherData, setWeatherData] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [position, setPosition] = useState([28.3974, 84.1258]) // Default to London
  const [searchQuery, setSearchQuery] = useState('')
  const mapRef = useRef(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPosition([position.coords.latitude, position.coords.longitude])
        //map.flyTo([latitude, longitude], map.getZoom());
        fetchWeather(position.coords.latitude, position.coords.longitude)
      },
      (err) => {
        setError("Unable to retrieve your location. Please enable location services.")
        fetchWeather(position[0], position[1]) // Fetch weather for default location
      }
    )
  }, [])

  useEffect(() => {
    if (position && position[0] && position[1]) {
      fetchWeather(position[0], position[1])
    }
  }, [position])

  const fetchWeather = async (lat, lon) => {
    if (!lat || !lon) {
      setError("Invalid coordinates. Please try again.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
      ])

      const weatherData = await weatherResponse.json()
      const forecastData = await forecastResponse.json()

      if (weatherData.cod !== 200 || forecastData.cod !== "200") {
        throw new Error("Failed to fetch weather data")
      }

      setWeatherData(weatherData)
      setForecast(forecastData)
    } catch (err) {
      setError("An error occurred while fetching weather data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchQuery}&limit=1&appid=${API_KEY}`)
      const data = await response.json()
      if (data.length > 0) {
        const { lat, lon } = data[0]
        setPosition([lat, lon])
        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 13)
        }
      } else {
        setError("Location not found. Please try a different search term.")
      }
    } catch (err) {
      setError("An error occurred while searching for the location. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (description) => {
    if (description.includes('clear')) return <Sun className="w-16 h-16 text-yellow-400" />
    if (description.includes('cloud')) return <Cloud className="w-16 h-16 text-gray-400" />
    return <CloudRain className="w-16 h-16 text-blue-400" />
  }





  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden"
      >
        <div className="md:flex">
          <div className="md:w-1/2 p-8">
            <h1 className="text-4xl font-light mb-8 text-gray-800">Weather <span className="font-semibold">Forecast</span></h1>
            <form onSubmit={handleSearch} className="mb-8 flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location..."
                className="flex-grow px-4 py-2 bg-gray-100 rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-500"
                aria-label="Search for a location"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-r-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-300"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-64"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                </motion.div>
              )}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r" 
                  role="alert"
                >
                  <p>{error}</p>
                </motion.div>
              )}
              {weatherData && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  className="mb-8"
                >
                  <h2 className="text-3xl font-light mb-4 text-gray-800">{weatherData.name}</h2>
                  <div className="flex items-center mb-6">
                    {getWeatherIcon(weatherData.weather[0].description)}
                    <div className="ml-4">
                      <p className="text-5xl font-light text-gray-800">{Math.round(weatherData.main.temp)}°C</p>
                      <p className="text-xl text-gray-600 capitalize">{weatherData.weather[0].description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center bg-gray-100 rounded-xl p-4">
                      <Wind className="w-8 h-8 mr-3 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Wind Speed</p>
                        <p className="text-lg font-semibold text-gray-800">{weatherData.wind.speed} m/s</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-100 rounded-xl p-4">
                      <Droplets className="w-8 h-8 mr-3 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Humidity</p>
                        <p className="text-lg font-semibold text-gray-800">{weatherData.main.humidity}%</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {forecast && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h3 className="text-2xl font-light mb-4 text-gray-800">5-Day Forecast</h3>
                  <div className="flex space-x-4 overflow-x-auto pb-4">
                    {forecast.list
                      .filter((item, index) => index % 8 === 0)
                      .slice(0, 5)
                      .map((item, index) => (
                        <motion.div 
                          key={index} 
                          className="flex-shrink-0 text-center bg-gray-100 rounded-xl p-4 w-24"
                          whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                          <p className="text-sm font-medium text-gray-600 mb-2">
                            {new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                          {getWeatherIcon(item.weather[0].description)}
                          <p className="text-lg font-semibold text-gray-800 mt-2">{Math.round(item.main.temp)}°C</p>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="md:w-1/2">
     
            <MapContainer 
              center={position} 
              zoom={13} 
              style={{ height: '100%', minHeight: '500px' }}
              ref={mapRef}
              className="rounded-3xl overflow-hidden"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker setPosition={setPosition} />
              <Marker position={position} icon={customIcon} />
         
            </MapContainer>
        
          </div>
        </div>
      </motion.div>
    </div>
  )
}