import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom';
import '../Coin/coin.css';
import DOMPurify from 'dompurify';
import { BiArrowBack } from 'react-icons/bi';

const Coin = () => {

    const params = useParams();
    const [coin, setCoin] = useState({});

    useEffect(()=>{
        axios.get(`https://pro-api.coingecko.com/api/v3/coins/${params.coinId}`,{headers: {
    'X-CoinGecko-Api-Key': 'CG-MywxH6neuB3DmtcNGLK4Bi9k'
  }}).then((res)=>{
            setCoin(res.data)
        }).catch((err)=>{
            console.log(err);
        })
    },[params.coinId])

  return (
    <div>
        <Link to={'/'}>
           <BiArrowBack className='previous'/>
        </Link>
        <div className='coin-container'>
            <div className='content'>
                <h2>{coin.name}</h2>
            </div>
            <div className='content'>
                <div className='rank'>
                    <span className='rank-btn'>Rank # {coin.market_cap_rank}</span>
                </div>
                <div className='info'>
                    <div className='coin-heading'>
                        {coin.image ? <img src={coin.image.small} alt='' /> : null}
                        <p>{coin.name}</p>
                        {coin.symbol ? <p>{coin.symbol.toUpperCase()}/USD</p> : null}                    
                    </div>
                    <div className='coin-price'>
                        {coin.market_data?.current_price ? <h1>${coin.market_data.current_price.usd.toLocaleString()}</h1> : null}
                    </div>
                </div>
            </div>

            <div className='content'>
                <table>
                    <thead>
                        <tr>
                            <th>1h</th>
                            <th>24h</th>
                            <th>7d</th>
                            <th>14d</th>
                            <th>30d</th>
                            <th>1yr</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{coin.market_data?.price_change_percentage_1h_in_currency ? <p>{coin.market_data.price_change_percentage_1h_in_currency.usd.toFixed(1)}%</p> : null}</td>
                            <td>{coin.market_data?.price_change_percentage_24h_in_currency ? <p>{coin.market_data.price_change_percentage_24h_in_currency.usd.toFixed(1)}%</p> : null}</td>
                            <td>{coin.market_data?.price_change_percentage_24h_in_currency ? <p>{coin.market_data.price_change_percentage_7d_in_currency.usd.toFixed(1)}%</p> : null}</td>
                            <td>{coin.market_data?.price_change_percentage_24h_in_currency ? <p>{coin.market_data.price_change_percentage_14d_in_currency.usd.toFixed(1)}%</p> : null}</td>
                            <td>{coin.market_data?.price_change_percentage_24h_in_currency ? <p>{coin.market_data.price_change_percentage_30d_in_currency.usd.toFixed(1)}%</p> : null}</td>
                            <td>{coin.market_data?.price_change_percentage_24h_in_currency ? <p>{coin.market_data.price_change_percentage_1y_in_currency.usd.toFixed(1)}%</p> : null}</td>

                        </tr>
                    </tbody>
                </table>
            </div>
            <div className='content'>
                <div className='stats'>
                    <div className='left'>
                        <div className='row'>
                            <h4>24 Hour Low</h4>
                            {coin.market_data?.low_24h ? <p>${coin.market_data.low_24h.usd.toLocaleString()}</p> : null}
                        </div>
                        <div className='row'>
                            <h4>24 Hour High</h4>
                            {coin.market_data?.high_24h ? <p>${coin.market_data.high_24h.usd.toLocaleString()}</p> : null}                            </div>

                    </div>
                    <div className='right'>
                        <div className='row'>
                            <h4>Market Cap</h4>
                            {coin.market_data?.market_cap ? <p>${coin.market_data.market_cap.usd.toLocaleString()}</p> : null}
                        </div>
                        <div className='row'>
                            <h4>Circulating Supply</h4>
                            {coin.market_data ? <p>{coin.market_data.circulating_supply}</p> : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className='content'>
                <div className='about'>
                    <h3>About</h3>
                    <p dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(coin.description ? coin.description.en : ''),
                    }}>
                    
                    </p>

                </div>
            </div>
        </div>
    </div>
  )
}

export default Coin
