<script lang="ts">
  import { onMount } from "svelte";

  import Game from "./game/game";

  import "./main.css";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const game = Game.instance;
      game.start(canvas.width, canvas.height, ctx);
    }
  });
</script>

<canvas bind:this={canvas} />
