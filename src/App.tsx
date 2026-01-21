import { useState, useCallback, useRef, useEffect } from 'react'
import './App.css'
import PoincarePlot from './PoincarePlot'
import BpmDisplay from './BpmDisplay'
import SdDisplay from './SdDisplay'

export interface RRData {
  value: number
  timestamp: number
}

const TIME_WINDOW = 2 * 60 * 1000 // 2 minutes in ms

function App() {
  const [rrIntervals, setRrIntervals] = useState<RRData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)

  // Prune data older than TIME_WINDOW
  useEffect(() => {
    const interval = setInterval(() => {
      setRrIntervals(prev => {
        if (prev.length === 0) return prev
        const cutoff = performance.now() - TIME_WINDOW
        const filtered = prev.filter(item => item.timestamp >= cutoff)
        return filtered.length === prev.length ? prev : filtered
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const parseHeartRateMeasurement = useCallback((value: DataView) => {
    const flags = value.getUint8(0)
    const rate16Bits = flags & 0x1
    let offset = 1

    if (rate16Bits) {
      offset += 2
    } else {
      offset += 1
    }

    const energyExpendedPresent = (flags >> 3) & 0x1
    if (energyExpendedPresent) {
      offset += 2
    }

    const rrIntervalPresent = (flags >> 4) & 0x1
    if (rrIntervalPresent) {
      const now = performance.now()
      const newIntervals: RRData[] = []
      while (offset + 1 < value.byteLength) {
        const rrRaw = value.getUint16(offset, true)
        // RR-Interval is in 1/1024 second units.
        const rrMs = Math.round((rrRaw / 1024) * 1000)
        newIntervals.push({ value: rrMs, timestamp: now })
        offset += 2
      }
      setRrIntervals(prev => {
        const combined = [...prev, ...newIntervals]
        const cutoff = performance.now() - TIME_WINDOW
        return combined.filter(item => item.timestamp >= cutoff)
      })
    }
  }, [])

  const handleCharacteristicValueChanged = useCallback((event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic
    console.log('Characteristic value changed event received');
    if (characteristic.value) {
      console.log('Characteristic value length:', characteristic.value.byteLength);
      parseHeartRateMeasurement(characteristic.value)
    } else {
      console.warn('Characteristic value is empty');
    }
  }, [parseHeartRateMeasurement])

  const connectBle = async () => {
    try {
      setError(null)
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not available in this browser.')
      }

      console.log('Requesting Bluetooth Device...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
      })

      console.log('Connecting to GATT Server...');
      const server = await device.gatt?.connect()
      if (!server) throw new Error('Could not connect to GATT server')

      console.log('Getting Heart Rate Service...');
      const service = await server.getPrimaryService('heart_rate')
      
      console.log('Getting Heart Rate Measurement Characteristic...');
      const characteristic = await service.getCharacteristic('heart_rate_measurement')
      characteristicRef.current = characteristic

      console.log('Adding Event Listener...');
      characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged)
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged)

      console.log('Starting Notifications...');
      await characteristic.startNotifications()

      // Workaround for some browsers/platforms where notifications might need a "kick"
      // or to ensure the characteristic value is actually read if it doesn't fire immediately
      try {
        const initialValue = await characteristic.readValue();
        if (initialValue) {
          console.log('Initial characteristic value read successfully');
          parseHeartRateMeasurement(initialValue);
        }
      } catch (e) {
        console.log('Initial read not supported or failed, relying on notifications:', e);
      }

      setIsConnected(true)

      device.addEventListener('gattserverdisconnected', () => {
        console.log('GATT Server disconnected');
        setIsConnected(false)
        characteristicRef.current = null
      })

    } catch (err) {
      console.error('Error in connectBle:', err)
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const disconnectBle = useCallback(() => {
    if (characteristicRef.current) {
      characteristicRef.current.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged)
      if (characteristicRef.current.service?.device?.gatt?.connected) {
        characteristicRef.current.service.device.gatt.disconnect()
      }
      characteristicRef.current = null
    }
    setIsConnected(false)
  }, [handleCharacteristicValueChanged])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (characteristicRef.current) {
        characteristicRef.current.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged)
        if (characteristicRef.current.service?.device?.gatt?.connected) {
          characteristicRef.current.service.device.gatt.disconnect()
        }
      }
    }
  }, [handleCharacteristicValueChanged])

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Polar H10 R-R Intervals</h1>
      
      <div className="card">
        {!isConnected ? (
          <button onClick={connectBle} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
            Connect to Polar H10
          </button>
        ) : (
          <button onClick={disconnectBle} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px' }}>
            Disconnect
          </button>
        )}
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>

      {isConnected && (
        <div style={{ marginTop: '20px' }}>
          <p>Status: <span style={{ color: 'green', fontWeight: 'bold' }}>Connected</span></p>
          <button onClick={() => setRrIntervals([])} style={{ marginBottom: '10px' }}>Clear Data</button>
        </div>
      )}

      {rrIntervals.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Visualization</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <BpmDisplay rrIntervals={rrIntervals} />
              <SdDisplay rrIntervals={rrIntervals} />
            </div>
            <PoincarePlot data={rrIntervals} />
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        border: '1px solid #ccc', 
        padding: '10px', 
        height: '400px', 
        overflowY: 'auto',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        textAlign: 'left'
      }}>
        <h3>R-R Intervals (ms):</h3>
        {rrIntervals.length === 0 ? (
          <p style={{ color: '#888' }}>No data streamed yet. Waiting for heart rate measurement...</p>
        ) : (
          <div id="rr-debug-output">
            {rrIntervals.map((item, index) => (
              <div key={index} style={{ fontSize: '12px', borderBottom: '1px solid #eee', padding: '2px 0' }}>
                <span style={{ color: '#888' }}>[{item.timestamp.toFixed(0)}ms]</span> {item.value}ms
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
