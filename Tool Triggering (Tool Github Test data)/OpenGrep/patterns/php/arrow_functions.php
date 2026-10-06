<?php

function foo()
{
  //OK:
  fn($x) => $y + 1;

  //MATCH:
  fn($x) => $x + 1; // arrow function (php 7.4)
  
  //MATCH:
  ($x ==> $x + 1); // short lambda (facebook-ext)
}

