"use client"; // 이 줄을 최상단에 추가합니다.

import { createGlobalStyle } from "styled-components";
import reset from "styled-reset";

const GlobalStyles = createGlobalStyle`
    ${reset};

    a {
      text-decoration: none;
      color: inherit;
    }

    * {		
      box-sizing: border-box;
    }

    html {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      background-color: #ffffff;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: gray;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-y: scroll;
    }

    button {
      border: none;
      cursor: pointer;
    }
    /* @font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter.woff2') format('woff2'),
       url('/fonts/Inter.woff') format('woff');
  font-weight: 400;
  font-style: normal;
} */

	  :root {	
		  --color-white : #ffffff; // fixed
		  --color-black : #000000; // fixed

      /* grey color */
      --color-grey-50 : #F9F9FA;
      --color-grey-100 : #EFF0F2;
      --color-grey-200 : #E0E2E6;
      --color-grey-300 : #D0D3D9; 
      --color-grey-400 : #C0C5CC;
      --color-grey-500 : #B0B6C0;
      --color-grey-600 : #8D9299;
      --color-grey-700 : #6A6D73;
      --color-grey-800 : #47494D;
      --color-grey-900 : #232426;



      /* blue-primary color */
      --color-blue-50 : #F4F8FF;
      --color-blue-100 : #D9E8FF;
      --color-blue-200 : #BCD7FF;
      --color-blue-300 : #78AEFF;
      --color-blue-400 : #4B93FF;
      --color-blue-500 : #1E78FF;
      --color-blue-600 : #1860CC;
      --color-blue-700 : #124899;
      --color-blue-800 : #0C3066;
      --color-blue-900 : #061833;


      /* yellow sub color */
      --color-yellow-50 : #FFFAEF;
      --color-yellow-100 : #FFF0CC;
      --color-yellow-200 : #FFE199;
      --color-yellow-300 :#FFD266;
      --color-yellow-400 : #FFC333;
      --color-yellow-500 : #FFB400;
      --color-yellow-600 : #CF8900;
      --color-yellow-700 : #996500;
      --color-yellow-800 : #664300;
      --color-yellow-900 : #332400;

      /* green sub color */
      --color-green-50 : #F8FEE8;
      --color-green-100 :#E2F4DD;
      --color-green-200 : #C6EABB;
      --color-green-300 :#A9DF99;
      --color-green-400 : #8DD476;
      --color-green-500 : #70C954;
      --color-green-600 : #00A42E;
      --color-green-700 : #437933;
      --color-green-800 : #2D5122;
      --color-green-900 : #162811;


      /* pink sub color */
      --color-pink-50 : #FFF5F5;
      --color-pink-100 :#FEE2E6;
      --color-pink-200 : #FCC6CC;
      --color-pink-300 : #FBA9B3;
      --color-pink-400 : #F98D99;
      --color-pink-500 : #FE5663;
      --color-pink-600 : #D44B5B;
      --color-pink-700 : #95434D;
      --color-pink-800 : #632D33;
      --color-pink-900 : #32161A;



      /* font-weight */

      --font-weight-extraBold: 800;
      --font-weight-bold: 700;
      --font-weight-semiBold: 600;
      --font-weight-medium: 500;
      --font-weight-regular: 400;

      /* font-size */

      --font-size-10: 10px;
      --font-size-12: 12px;
      --font-size-14: 14px;
      --font-size-16: 16px;
      --font-size-18: 18px;
      --font-size-20: 20px;
      --font-size-22: 22px;
      --font-size-24: 24px;
      --font-size-26: 26px;
      --font-size-28: 28px;
      --font-size-30: 30px;
      --font-size-32: 32px;
      --font-size-34: 34px;
      --font-size-36: 36px;
      --font-size-40: 40px;
  }
`;

export default GlobalStyles;
