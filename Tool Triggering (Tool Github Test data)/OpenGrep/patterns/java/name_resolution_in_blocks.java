public class ASTReference {

    private String literal = null;
    
    public void setLiteral(String literal) {
        if (this.literal == null) {
            this.literal = literal;
        }
    }

    public String literal() {
        // OK:
        return literal != null;
    }
}
