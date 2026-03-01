const fs = require('fs');

const filesToFix = [
    'pages/LoginPage.tsx',
    'pages/RegisterPage.tsx',
    'pages/ModelsPage.tsx',
    'pages/HomePage.tsx',
    'components/Header.tsx',
    'components/ModelCard.tsx',
    'components/ui/sign-up.tsx',
    'components/Footer.tsx',
    'components/LanguageSwitcher.tsx'
];

filesToFix.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    // Replace "/${currentLang}/models" with "/catalog"
    content = content.replace(/\/\$\{currentLang\}\/models/g, '/catalog');
    
    // Replace "/${currentLang}" with "" or "/"
    // For cases like to={`/${currentLang}`} -> to={`/`}
    content = content.replace(/\/\$\{currentLang\}/g, '');
    
    // Sometimes it might leave to={``} after replacing, let's fix it:
    content = content.replace(/to=\{\`\`\}/g, 'to="/"');
    
    fs.writeFileSync(f, content);
});

// For App.tsx, a more structured replacement is needed to remove /:lang/ routes
let appContent = fs.readFileSync('App.tsx', 'utf8');

// Replace /models with /catalog
appContent = appContent.replace(/path="\/models/g, 'path="/catalog');

// Remove LanguageWrapper usage and replace with plain <Routes> items
const routeReplacement = `
          <Route path="/login" element={
            <motion.div 
              key="login"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.5 }}
            >
              <LoginPage />
            </motion.div>
          } />
          <Route path="/register" element={
            <motion.div 
              key="register"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.5 }}
            >
              <RegisterPage />
            </motion.div>
          } />
          
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<ModelsPage />} />
          <Route path="/catalog/category/:category" element={<ModelsPage />} />
          <Route path="/catalog/:slug" element={<ModelProfilePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/book-now" element={<BookingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
`;

// we will just recreate App.tsx to ensure correctness
console.log('Done!');
