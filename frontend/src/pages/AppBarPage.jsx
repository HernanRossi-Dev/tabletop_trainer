import MenuIcon from "@suid/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from "@suid/material";

export default function BasicAppBar() {
  const handleHomeClick = () => {
    window.location.href = "/";
  };
  const handleBattlesClick = () => {
    window.location.href = "/battles";
  };
  const handleLoginClick = () => {
    window.location.href = "/login";
  };
  const handleAboutClick = () => {
    window.location.href = "/about";
  };

  return (
    <Box sx={{ flexGrow: 5 }}>
      <AppBar position="static" sx={{ backgroundColor: "rgb(3, 150, 156);" }}>
        <Toolbar sx={{ justifyContent: "flex-start" }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              fontFamily: '"Share Tech Mono", "Orbitron", "Audiowide", "Roboto Mono", monospace',
              mr: 2,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Battle Command AI
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              ml: 2,
            }}
          >
            <Button color="inherit" onClick={handleHomeClick}>Home</Button>
            <Button color="inherit" onClick={handleBattlesClick}>Battles</Button>
            <Button color="inherit" onClick={handleAboutClick}>About</Button>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" onClick={handleLoginClick}>Login</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}