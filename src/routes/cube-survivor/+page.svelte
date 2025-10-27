<script lang="ts">
  import { onMount } from "svelte";

  import Game from "./game/game";
  import Game2 from "./game/game2";

  import "./main.css";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // const game = Game.instance;
      // game.start();
      const game2 = Game2.instance;
      game2.start(canvas.width, canvas.height, ctx);
    }
  });
</script>

<canvas bind:this={canvas} />
