import React from 'react';
import '../Coins/coins.css';

const CoinItem = (props) => {
  return (
    <div className='coin-row'>
        <p>{props.coins.market_cap_rank}</p>
        <div className="img-symbol">
            <img src={props.coins.image} alt="Icon" />
            <p>{props.coins.symbol.toUpperCase()}</p>
        </div>
        <p>{props.coins.current_price.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
        {props.coins.price_change_percentage_24h < 0? (<p className='red'>{props.coins.price_change_percentage_24h.toFixed(2)}%</p>
): (<p className='green'>{props.coins.price_change_percentage_24h.toFixed(2)}%</p>)}
        <p className='hide-mobile'>{props.coins.total_volume.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
        <p className='hide-mobile'>{props.coins.market_cap.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
    </div>
  )
}

export default CoinItem