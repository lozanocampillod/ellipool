let balls = [];
let cueBall, blueBall, blackBall;
let tableCenter, tableA, tableB;
let focusHole, focusMark;
let holeRadius = 20,
    markRadius = 5;
let isAiming = false,
    aimCurrent;

function setup() {
  createCanvas(windowWidth, windowHeight);
  tableCenter = createVector(width / 2, height / 2);

  tableA = width * 0.4;  // Relative to screen width
  tableB = height * 0.35; // Relative to screen height

  let c = sqrt(tableA * tableA - tableB * tableB);
  focusHole = createVector(tableCenter.x - c, tableCenter.y);
  focusMark = createVector(tableCenter.x + c, tableCenter.y);

  // Ball positions are now relative to table size
  cueBall = new Ball(tableCenter.x + tableA * 0.55, tableCenter.y, 12, color(255));
  blueBall = new Ball(tableCenter.x + tableA * 0.50, tableCenter.y - tableB * 0.05, 12, color(0, 0, 255));
  blackBall = new Ball(tableCenter.x + tableA * 0.50, tableCenter.y + tableB * 0.05, 12, color(0));

  balls = [cueBall, blueBall, blackBall];
}


function windowResized() {
  let prevWidth = width;
  let prevHeight = height;

  resizeCanvas(windowWidth, windowHeight);

  let newTableCenter = createVector(width / 2, height / 2);
  let scaleX = width / prevWidth;
  let scaleY = height / prevHeight;

  tableCenter.set(newTableCenter.x, newTableCenter.y);
  tableA = width * 0.4;
  tableB = height * 0.35;

  let c = sqrt(tableA * tableA - tableB * tableB);
  focusHole.set(tableCenter.x - c, tableCenter.y);
  focusMark.set(tableCenter.x + c, tableCenter.y);

  // Scale ball positions accordingly
  for (let ball of balls) {
    ball.pos.x = (ball.pos.x - prevWidth / 2) * scaleX + width / 2;
    ball.pos.y = (ball.pos.y - prevHeight / 2) * scaleY + height / 2;
  }
}


function draw() {
  background(0, 150, 0);
  noFill();
  stroke(255);
  strokeWeight(6);
  ellipse(tableCenter.x, tableCenter.y, tableA * 2, tableB * 2);

  stroke(255);
  strokeWeight(2);
  fill(0);
  ellipse(focusHole.x, focusHole.y, holeRadius * 2);

  noStroke();
  fill(255, 0, 0);
  ellipse(focusMark.x, focusMark.y, markRadius * 2);

  if (isAiming) {
    stroke(150, 75, 0);
    strokeWeight(6);
    line(cueBall.pos.x, cueBall.pos.y, aimCurrent.x, aimCurrent.y);
  }

  for (let ball of balls) {
    ball.update();
    ball.checkBoundary();
    ball.display();
  }

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      resolveBallCollision(balls[i], balls[j]);
    }
  }

  balls = balls.filter(ball => dist(ball.pos.x, ball.pos.y, focusHole.x, focusHole.y) > holeRadius);
  if (cueBall && !balls.includes(cueBall)) cueBall = null;
}

function isInsideEllipse(pt, center, a, b) {
  let dx = pt.x - center.x,
      dy = pt.y - center.y;
  return (dx * dx) / (a * a) + (dy * dy) / (b * b) <= 1;
}

class Ball {
  constructor(x, y, r, col) {
    this.pos = createVector(x, y);
    this.r = r;
    this.vel = createVector(0, 0);
    this.col = col;
  }
  update() {
    this.pos.add(this.vel);
    this.vel.mult(0.98);
  }
  display() {
    fill(this.col);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }
  checkBoundary() {
    let effA = tableA - this.r,
        effB = tableB - this.r,
        dx = this.pos.x - tableCenter.x,
        dy = this.pos.y - tableCenter.y;
    if ((dx * dx) / (effA * effA) + (dy * dy) / (effB * effB) > 1) {
      let n = createVector(dx / (effA * effA), dy / (effB * effB)).normalize(),
          dot = this.vel.dot(n);
      this.vel.sub(p5.Vector.mult(n, 2 * dot));
      let t = 1 / sqrt((dx * dx) / (effA * effA) + (dy * dy) / (effB * effB));
      this.pos = p5.Vector.add(tableCenter, createVector(dx * t, dy * t));
    }
  }
}

function resolveBallCollision(b1, b2) {
  let diff = p5.Vector.sub(b2.pos, b1.pos),
      d = diff.mag(),
      minDist = b1.r + b2.r;
  if (d < minDist) {
    let n = diff.copy().normalize(),
        relVel = p5.Vector.sub(b1.vel, b2.vel),
        speed = relVel.dot(n);
    if (speed > 0) {
      let impulse = n.copy().mult(speed);
      b1.vel.sub(impulse);
      b2.vel.add(impulse);
    }
    let overlap = minDist - d;
    b1.pos.sub(n.copy().mult(overlap / 2));
    b2.pos.add(n.copy().mult(overlap / 2));
  }
}

function mousePressed() {
  let mouseVec = createVector(mouseX, mouseY);
  if (!isInsideEllipse(mouseVec, tableCenter, tableA, tableB)) return;
  if (!cueBall) {
    cueBall = new Ball(mouseX, mouseY, 12, color(255));
    balls.push(cueBall);
    return;
  }
  if (dist(mouseX, mouseY, cueBall.pos.x, cueBall.pos.y) < cueBall.r) {
    isAiming = true;
    aimCurrent = mouseVec.copy();
  } else {
    cueBall.pos = mouseVec.copy();
    cueBall.vel.set(0, 0);
  }
}

function mouseDragged() {
  if (isAiming) aimCurrent = createVector(mouseX, mouseY);
}

function mouseReleased() {
  if (isAiming) {
    let impulse = p5.Vector.sub(cueBall.pos, aimCurrent);
    cueBall.vel = impulse.mult(0.1);
    isAiming = false;
  }
}
