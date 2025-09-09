const Footer = () => {
  return (
    <footer className="w-full py-4 mt-auto border-t bg-background">
      <div className="container mx-auto text-center text-xs text-muted-foreground space-y-1">
        <p>build tete 0.0.1 version</p>
        <p>RyannBreston desenvolvedor</p>
        <p>© {new Date().getFullYear()} Acelera GT. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
