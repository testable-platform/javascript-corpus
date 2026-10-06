public class Test {
       
  public void foo() {
    // ruleid: constant_propagation_ref_in_class
    int d = c;
  }
  private int c = 3;
}
