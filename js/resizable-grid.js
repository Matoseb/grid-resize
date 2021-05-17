function createResizableGrid({
  columns = [],
  rows = [],
  gapThickness = '20px',
  gapColor = 'black',
  container,
  width = '100%',
  height = '100%',
}) {
  if (!isNaN(columns)) columns = new Array(columns).fill('1fr');
  if (!isNaN(rows)) rows = new Array(rows).fill('1fr');

  const el = document.querySelector(container);

  Object.entries({
    class: 'grid-container',
    'v-bind:style': 'mainGridStyle',
  }).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });

  el.innerHTML = `<div :class="\`grid-cell cell-\${cell.index}\`"
        v-for="cell in cells"
        :key="cell.index"
        :ref="cell.index"
        @mouseDown="cellMouseDown"
      >
      </div>`;

  const app = new Vue({
    el: container,
    data() {
      return {
        columns,
        rows,
        cells: [],
        gapThickness,
        gapColor,
        index: 0,
        width,
        height,
        mouse: {
          down: false,
          offset: { x: 0, y: 0 },
          colTotal: 0,
          rowTotal: 0,
          cell: null,
          columns: [],
          rows: [],
          direction: 'x', //x, y
        },
      };
    },
    computed: {
      mainGridStyle() {
        return {
          'grid-template': `${this.rows.join(' ')} / ${this.columns.join(' ')}`,
          width: this.width,
          height: this.height,
          '--gap-thickness': this.gapThickness,
          '--gap-color': this.gapColor,
        };
      },
    },
    methods: {
      async addRow(rowIndex, size = '1fr') {
        const newElems = [];
        this.rows.splice(rowIndex, 0, size);

        for (let column = 0; column < this.columns.length; column++) {
          const pos = rowIndex * this.columns.length + column;
          const cellProps = this.addCell();
          newElems.push(cellProps);
          this.cells.splice(pos, 0, cellProps);
        }

        await this.$nextTick();
        return newElems.map(({ index }) => this.$refs[index][0]);
      },

      async addColumn(columnIndex, size = '1fr') {
        const newElems = [];
        this.columns.splice(columnIndex, 0, size);

        for (let row = 0; row < this.rows.length; row++) {
          const pos = columnIndex + row * this.columns.length;
          const cellProps = this.addCell();
          newElems.push(cellProps);
          this.cells.splice(pos, 0, cellProps);
        }

        await this.$nextTick();
        return newElems.map(({ index }) => this.$refs[index][0]);
      },

      removeColumn(columnIndex) {
        for (let row = this.rows.length - 1; row >= 0; row--) {
          const pos = columnIndex + row * this.columns.length;
          this.cells.splice(pos, 1);
        }

        this.columns.splice(columnIndex, 1);
      },

      removeRow(rowIndex) {
        for (let column = this.columns.length - 1; column >= 0; column--) {
          const pos = rowIndex * this.columns.length + column;
          this.cells.splice(pos, 1);
        }

        this.rows.splice(rowIndex, 1);
      },

      cellMouseDown(ev) {
        const cell = ev.currentTarget;

        this.mouse.cell = cell;
        this.mouse.columns = [...this.columns];
        this.mouse.rows = [...this.rows];

        const { column, row } = this.getCellPosition(cell);
        const { offsetWidth, offsetHeight, offsetLeft, offsetTop } = cell;

        this.mouse.offset = {
          x: ev.pageX - (offsetLeft + offsetWidth),
          y: ev.pageY - (offsetTop + offsetHeight),
        };

        if (ev.offsetX >= offsetWidth) {
          this.mouse.direction = 'x';
          const colLeft = this.toPixelUnit(this.columns[column]);
          const colRight = this.toPixelUnit(this.columns[column + 1]);
          this.mouse.colTotal = colLeft + colRight;
          this.mouse.down = true;
          document.body.classList.add('resize-x');
        }

        if (ev.offsetY >= offsetHeight) {
          this.mouse.direction = 'y';
          this.mouse.down = true;
          const rowLeft = this.toPixelUnit(this.rows[row]);
          const rowRight = this.toPixelUnit(this.rows[row + 1]);
          this.mouse.rowTotal = rowLeft + rowRight;
          document.body.classList.add('resize-y');
        }
      },

      insert({ row, column }, elem) {
        const cell = this.getCell({ column, row });
        if (!cell) return console.error('Cell does not exists (yet). ');
        cell.appendChild(elem);
      },

      mouseMove(ev) {

        if (!this.mouse.down) return;

        const { cell, direction, colTotal, rowTotal, offset } = this.mouse;
        const { column, row } = this.getCellPosition(cell);
        const gap = this.toPixelUnit(this.gapThickness);

        if (direction === 'x') {
          const nextCell = this.getCell({ column: column + 1, row });
          const cellLeft = cell.offsetLeft;
          const cellRight = nextCell.offsetLeft + nextCell.offsetWidth;
          const x = ev.pageX + gap / 2 - offset.x;
          const val = this.clampedMap(x, cellLeft, cellRight, 0, colTotal);

          this.$set(this.columns, column, `${val}fr`);
          this.$set(this.columns, column + 1, `${colTotal - val}fr`);
        }

        if (direction === 'y') {
          const nextCell = this.getCell({ row: row + 1, column });
          const top = cell.offsetTop;
          const bottom = nextCell.offsetTop + nextCell.offsetHeight;
          const y = ev.pageY + gap / 2 - offset.y;
          const val = this.clampedMap(y, top, bottom, 0, rowTotal);

          this.$set(this.rows, row, `${val}fr`);
          this.$set(this.rows, row + 1, `${rowTotal - val}fr`);
        }
      },

      toPixelUnit(number) {
        return parseFloat(number); // won't work with percent
      },

      getCell({ row, column }) {
        if (column >= this.columns.length) return;
        if (row >= this.rows.length) return;

        const index = row * this.columns.length + column;
        const cell = this.$el.children[index];
        return cell;
      },

      getCellIndex(cell) {
        return Array.prototype.indexOf.call(this.$el.children, cell);
      },

      getCellPosition(cell) {
        const index = this.getCellIndex(cell);
        const column = index % this.columns.length;
        const row = (index - column) / this.columns.length;
        return { column, row };
      },

      clampedMap(num, start1, stop1, start2, stop2) {
        return this.map(
          this.clamp(num, start1, stop1),
          start1,
          stop1,
          start2,
          stop2
        );
      },

      clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
      },

      map(num, start1, stop1, start2, stop2) {
        return ((num - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
      },

      mouseUp(ev) {
        this.mouse.down = false;
        document.body.classList.remove('resize-x', 'resize-y');
      },

      addCell() {
        const cellProps = { index: this.index };
        this.index++;
        return cellProps;
      },
    },
    created() {
      window.addEventListener('mousemove', this.mouseMove);
      window.addEventListener('mouseup', this.mouseUp);

      for (let row = 0; row < this.rows.length; row++) {
        for (let column = 0; column < this.columns.length; column++) {
          this.cells.push(this.addCell());
        }
      }
    },

    destroyed() {
      window.removeEventListener('mousemove', this.mouseMove);
      window.removeEventListener('mouseup', this.mouseUp);
    },
  });

  return app;
}
