"use strict";

export class Vector {
  constructor(x, y) { this.x = x; this.y = y;}

  add(vector) { return new Vector(this.x + vector.x, this.y + vector.y); }
  addTo(vector) { this.x += vector.x; this.y += vector.y; }
  sub(vector) { return new Vector( this.x - vector.x, this.y - vector.y);}
  subFrom(vector) { this.x -= vector.x; this.y -= vector.y; }

  mult(n) { return new Vector(this.x * n, this.y * n); }
  multTo(n) { this.x *= n; this.y *= n; return this; }
  div(n) { return new Vector(this.x / n, this.y / n); }

  setAngle(angle) {
    const length = this.getLength();
    this.x = Math.cos(angle) * length; this.y = Math.sin(angle) * length;
  }

  setLength(length) {
    const angle = this.getAngle();
    this.x = Math.cos(angle) * length; this.y = Math.sin(angle) * length;
  }

  getAngle() { return Math.atan2(this.y, this.x); }
  getLength() { return Math.sqrt(this.x * this.x + this.y * this.y); }

  getLengthSq() { return this.x * this.x + this.y * this.y; }

  distanceTo(vector) { return this.sub(vector).getLength(); }

  copy() { return new Vector(this.x, this.y); }

  equals(vector) { return this.x === vector.x && this.y === vector.y; }
}
export default Vector;
