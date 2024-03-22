import { nextTick } from 'vue';

function regenRecordCanvas(svg: string, svgWidth: number, svgHeight: number) {
  nextTick(() => {
    const ctx = (
      document.getElementById('record') as HTMLCanvasElement
    ).getContext('2d')!;

    const image = new Image();
    image.onload = () => {
      ctx.canvas.setAttribute(
        'width',
        (svgWidth * 10).toString()
      );
      ctx.canvas.setAttribute(
        'height',
        (svgHeight * 10).toString()
      );
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.scale(0.1, 0.1);
    };
    // TODO: Update this to use the respective theme's background color
    image.src = `data:image/svg+xml;base64,${btoa(
      svg.replace('style="', 'style="background-color:#fff;')
    )}`;
  });
}

export default regenRecordCanvas;
