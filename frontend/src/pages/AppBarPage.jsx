import LoginIcon from "@suid/icons-material/Login";
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
} from "@suid/material";
import { user, replaceUser } from '../store/user_store';
import { createSignal } from "solid-js";

export default function BasicAppBar() {
  const [anchorEl, setAnchorEl] = createSignal(null);
  const handleHomeClick = () => window.location.href = "/";
  const handleBattlesClick = () => window.location.href = "/battles";
  const handleLoginClick = () => window.location.href = "/login";
  const handleAboutClick = () => window.location.href = "/about";

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleUserDetails = () => {
    handleMenuClose();
    window.location.href = "/user-details";
  };

  const handleBattlePlannerClick = () => {
    window.location.href = "/battle-planner";
  };

  const handleLogout = () => {
    handleMenuClose();
    replaceUser({
      jwt: "",
      id: "",
      name: "",
      email: undefined,
      profile_picture: undefined,
      provider: "google"
    });
    window.location.href = "/";
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
              fontFamily: '"Share Tech Mono", "Iceberg", "Audiowide", "Roboto Mono", monospace',
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
            <Button color="inherit" onClick={handleBattlePlannerClick}>Battle Planner</Button>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {user.id ? (
            <>
              <IconButton onClick={handleAvatarClick} sx={{ ml: 2 }}>
                <Avatar
                  src={user.profile_picture || ""}
                  alt={user.name}
                  sx={{ width: 36, height: 36, cursor: "pointer" }}
                />
              </IconButton>
              <Menu
                anchorEl={anchorEl()}
                open={Boolean(anchorEl())}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={handleUserDetails}>User Details</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" startIcon={<LoginIcon />} onClick={handleLoginClick}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}