// p5 Instance
const sketch1 = new p5((p) => {
  p.setup = () => {
    p.createCanvas(100, 100);
  };

  p.draw = () => {
    // auto resize canvas
    const { offsetWidth, offsetHeight } = p.canvas;
    p.resizeCanvas(offsetWidth, offsetHeight);

    p.background(0);
    p.fill(255);
    p.ellipse(p.mouseX, p.mouseY, 50);
  };
});

window.addEventListener('load', async () => {
  const grid = createResizableGrid({
    rows: 4, // ['1fr', '1fr']
    columns: 2, // ['1fr', '1fr', '1fr']
    gapThickness: '5px',
    gapColor: 'black', 
    width: '80vmin',
    height: '90vmin',
    container: '#main-grid',
  });

  await grid.addColumn(0); // add a column as first column, await -> wait for generation
  await grid.addRow(1); // add a row at as second row

  // to remove: grid.removeRow(0), grid.removeColumn(0);

  const textDiv = document.createElement('div');
  textDiv.contentEditable = true; // Edit text by clicking the textDiv element
  textDiv.textContent = 'TITLE HERE';
  textDiv.classList.add('text-div');

  grid.insert({ column: 0, row: 2 }, textDiv);
  grid.insert({ column: 0, row: 3 }, sketch1.canvas);
});
