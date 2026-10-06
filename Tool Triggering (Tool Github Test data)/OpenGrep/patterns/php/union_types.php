<?php

class foobar
{
	public function foo(int|null $id)
	{
		doSomething($id);
	}

	public function bar(string $input)
	{
        	//MATCH:
		$i = 5;
	}
}
