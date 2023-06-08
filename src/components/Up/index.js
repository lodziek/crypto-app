import React, { useEffect, useState } from 'react';
import '../../App.css';
import {BsArrowUpShort} from 'react-icons/bs';

const Up = () => {

    const [toTop, setToTop] = useState(false);
    
    useEffect(()=>{
        window.addEventListener('scroll', ()=>{
            if(window.scrollY > 100){
                setToTop(true)
            } else {
                setToTop(false)
            }
        })
    }, [])

    const scrollUp = () => {
        window.scrollTo({
            top: 0,
            behavior:'smooth'
        })
    }

  return (
    <div>
        {toTop && <BsArrowUpShort className='up' onClick={scrollUp}/>}
    </div>
  )
}

export default Up