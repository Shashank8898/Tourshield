import HomePage from "./components/HomePage.jsx"
import { Routes, Route, Link } from "react-router-dom"; 
import GetStartedPage from "./components/GetStartedPage";
import SignUpPage from "./components/SignUpPage";
import LiveLocationPage from "./LiveLocationPage.jsx";
import ChatBotPage from "./components/ChatbotPage";
import Profile from "./components/Profile.jsx";
import LoginPage from "./components/LoginPage.jsx";
import BlockID from "./components/BlockID.jsx";
export default function App(){


  return(
      <>
      <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/getStarted" element={<GetStartedPage/>} />
          <Route path='/signup' element={<SignUpPage/>}/>
          <Route path='/livelocation' element={<LiveLocationPage/>}/>
          <Route path='/chatbot' element={<ChatBotPage/>}/>
          <Route path='/login' element={<LoginPage/>}/>
          <Route path='/:userID/TripFile' element={<BlockID/>}/>
          <Route path='/:userID/Profile' element={<Profile/>}/>
      </Routes>
      <ChatBotPage/>
      </>
  )
}