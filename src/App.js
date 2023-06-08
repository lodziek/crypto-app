import { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import Coins from './components/Coins';
import Navbar from './components/Navbar';
import { Routes, Route } from 'react-router-dom';
import Coin from './routes/Coin';
import Up from './components/Up';


function App() {

  const [coins, setCoins] = useState([]);

  useEffect(()=>{
    axios
    .get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en')
    .then((res)=>{
      setCoins(res.data);
    }).catch((err)=>{
      console.log(err);
    })
  },[])

  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Coins coins={coins} />}/>
        {/* <Route path='/coin' element={<Coin />}/> */}
        <Route path='/coin/:coinId' element={<Coin />}/>
      </Routes>
      <Up />  
    </>
  );
}

export default App;
