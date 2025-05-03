import sectorCommandLogo from '../assets/sc_logo.png'
import { useNavigate } from '@solidjs/router'
import '../App.css'
import { Typography } from "@suid/material";
import { user } from "../store/UserStore";

function AboutPage() {
    const navigate = useNavigate();

    console.log('In the about page');
    console.log(user.id);
    console.log(user.token);
    console.log(user.email);
    return (
        <>
            <div>
                <Typography
                    variant="h4"
                    component="div"
                    sx={{
                    fontWeight: 700,
                    fontFamily: '"Share Tech Mono", "Orbitron", "Audiowide", "Roboto Mono", monospace',
                    mr: 2,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    pt: 3, // Add padding-bottom (theme spacing unit)
                    pb: 1, // Add padding-bottom (theme spacing unit)
                    }}
                >
                    About Battle Command AI
                </Typography>
                    <div style={{ cursor: 'pointer', display: 'inline-block' }} onClick={() => navigate('/')}>
                        <img src={sectorCommandLogo} class="logo"/>
                    </div>
                <p>
                    Battle Command AI is a web application that lets you practice your tabletop games using AI. 
                    Simply take a picture of your game, and the AI will analyze the board and play as your opponent, helping you improve your skills.
                </p>
            </div>
        </>
    )
}

export default AboutPage;