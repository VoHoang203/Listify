
app.use(cors({
  origin: ["http://localhost:3000", "https://your-frontend.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
//cors for deploy
