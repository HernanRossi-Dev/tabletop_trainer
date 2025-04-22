import sectorCommandLogo from '../assets/sc_logo.png'
import { useNavigate } from '@solidjs/router'
import '../App.css'


function AboutPage() {
    const navigate = useNavigate();
    return (
        <>
            <div>
                <h1>About Sector Command AI</h1>
                    <div style={{ cursor: 'pointer', display: 'inline-block' }} onClick={() => navigate('/')}>
                        <img src={sectorCommandLogo} class="logo"/>
                    </div>
                <p>
                    Sector Command AI is a web application that lets you practice your tabletop games using AI. 
                    Simply take a picture of your game, and the AI will analyze the board and play as your opponent, helping you improve your skills.
                </p>
            </div>
        </>
    )
}

export default AboutPage;