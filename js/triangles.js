import Vector from './vector.mjs';
/*
  Similar triangles (side splitting theorem):
 http://www.malinc.se/math/geometry/similartrianglesen.php
 https://en.wikipedia.org/wiki/Delaunay_triangulation
 https://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm
 https://en.wikipedia.org/wiki/Circumscribed_circle
 */

class Triangle {
  constructor(a, b, c) { this.a = a; this.b = b; this.c = c;}

  vertexes() { return [this.a, this.b, this.c]; }

  edges() { return [[this.a, this.b], [this.b, this.c], [this.c, this.a]]; }

  sharesAVertexWith(triangle) {
    // TODO: optimize me please!
    for(let i = 0; i < 3; i++) {
      for(let j = 0; j < 3; j++) {
        let v = this.vertexes()[i];
        let vv = triangle.vertexes()[j];
        if(v.equals(vv)) {
          return true;
        }
      }
    }
    return false;
  }

  hasEdge(edge) {
    for(let i = 0; i < 3; i++) {
      let e = this.edges()[i];
      if(e[0].equals(edge[0]) && e[1].equals(edge[1]) ||
        e[1].equals(edge[0]) && e[0].equals(edge[1])) {
        return true;
      }
    }
    return false;
  }

  circumcenter() {
    let d = 2 * (this.a.x * (this.b.y - this.c.y) + this.b.x * (this.c.y - this.a.y) + this.c.x * (this.a.y - this.b.y));

    let x = 1 / d * ((this.a.x * this.a.x + this.a.y * this.a.y) * (this.b.y - this.c.y) +
      (this.b.x * this.b.x + this.b.y * this.b.y) * (this.c.y - this.a.y) +
      (this.c.x * this.c.x + this.c.y * this.c.y) * (this.a.y - this.b.y));

    let y = 1 / d * ((this.a.x * this.a.x + this.a.y * this.a.y) * (this.c.x - this.b.x) +
      (this.b.x * this.b.x + this.b.y * this.b.y) * (this.a.x - this.c.x) +
      (this.c.x * this.c.x + this.c.y * this.c.y) * (this.b.x - this.a.x));
    return new Vector(x, y);
  }

  circumradius() {
    return this.circumcenter().sub(this.a).getLength();
  }

  pointIsInsideCircumcircle(point) {
    let circumcenter = this.circumcenter();
    let circumradius = circumcenter.sub(this.a).getLength();
    let dist = point.sub(circumcenter).getLength();
    return dist < circumradius;
  }

  draw() {
    ctx.strokeStyle = "black";
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.lineTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.lineTo(this.c.x, this.c.y);
    ctx.closePath();
    ctx.stroke();

    // Similar triangles, see link at the top
    let nrOfPoints = Math.round(Math.random() * 9 + 2);
    let points1 = this.getPoints(this.c, this.a, nrOfPoints);
    let points2 = this.getPoints(this.c, this.b, nrOfPoints);
    for(let i = 0; i < nrOfPoints; i++) {
      ctx.beginPath();
      ctx.moveTo(points1[i].x, points1[i].y);
      ctx.lineTo(points2[i].x, points2[i].y);
      ctx.stroke();
    }
  }

  getPoints(p1, p2, nrOfPoints) {
    let points = [];
    let delta = p1.sub(p2).div(nrOfPoints + 1);
    for(let i = 1; i < nrOfPoints+1; i++) {
      let currentPos = p2.add(delta.mult(i));
      points.push(currentPos);
    }
    return points;
  }
}

let canvas, ctx, w, h;

function setup() {
  canvas = document.querySelector("#canvas");
  ctx = canvas.getContext("2d");
  reset();
  window.addEventListener("resize", reset);
  canvas.addEventListener("click", draw);
}

function reset() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  draw();
}

function getRandomPoints() {
  let pointList = [];
  let divisor = Math.random() * 5000 + 5000;

  let nrOfPoints = w * h / divisor;
  for(let i = 0; i < nrOfPoints; i++) {
    pointList.push(new Vector(
      Math.random() * w * 0.95 + w * 0.025,
      Math.random() * h * 0.95 + h * 0.025
    ));
  }
  return pointList;
}

function bowyerWatson (superTriangle, pointList) {
  // pointList is a set of coordinates defining the
  // points to be triangulated
  let triangulation = [];

  // add super-triangle to triangulation
  // must be large enough to completely contain all
  // the points in pointList
  triangulation.push(superTriangle);

  // add all the points one at a time to the triangulation
  pointList.forEach(point => {
    let badTriangles = [];

    // first find all the triangles that are no
    // longer valid due to the insertion
    triangulation.forEach(triangle => {
      if(triangle.pointIsInsideCircumcircle(point)) {
        badTriangles.push(triangle);
      }
    });
    let polygon = [];

    // find the boundary of the polygonal hole
    badTriangles.forEach(triangle => {
      triangle.edges().forEach(edge => {
        let edgeIsShared = false;
        badTriangles.forEach(otherTriangle => {
          if(triangle !== otherTriangle &&  otherTriangle.hasEdge(edge)) {
            edgeIsShared = true;
          }
        });
        if(!edgeIsShared) {
          //edge is not shared by any other
          // triangles in badTriangles
          polygon.push(edge);
        }
      });
    });

    // remove them from the data structure
    badTriangles.forEach(triangle => {
      let index = triangulation.indexOf(triangle);
      if (index > -1) {
        triangulation.splice(index, 1);
      }
    });

    // re-triangulate the polygonal hole
    polygon.forEach(edge => {
      //form a triangle from edge to point
      let newTri = new Triangle(edge[0], edge[1], point);
      triangulation.push(newTri);
    });
  });

  // done inserting points, now clean up
  let i = triangulation.length;
  while(i--) {
    let triangle = triangulation[i];
    if(triangle.sharesAVertexWith(superTriangle)) {
      //remove triangle from triangulation
      let index = triangulation.indexOf(triangle);
      if (index > -1) {
        triangulation.splice(index, 1);
      }
    }
  }

  return triangulation;
}

function draw() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, w, h);
  let pointList = getRandomPoints();

  let superTriangle = new Triangle(
    new Vector(-w * 2, h * 2),
    new Vector(w * 2, h * 2),
    new Vector(w / 2, -h * 2)
  );

  let triangles = bowyerWatson(superTriangle, pointList);
  triangles.forEach(t => t.draw());
}

setup();
