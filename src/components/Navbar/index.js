import React from 'react';
import '../Navbar/navbar.css';
import {FaCoins} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <Link to={'/'}>
      <div>
          <div className="navbar">
              <FaCoins className='icon' />
              <h2>Crypto <span className='purple'>Tracker</span></h2>
          </div>
      </div>
    </Link>
  )
}

export default Navbar