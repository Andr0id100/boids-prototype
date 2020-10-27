var scene = new THREE.Scene()

const O_CAM = true
// const O_CAM = false

var camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 2000);

if (O_CAM)
{
  var camera_o = new THREE.OrthographicCamera(window.innerWidth/-2, window.innerWidth/2, window.innerHeight/2, window.innerHeight/-2, 1, 1000)
  camera_o.position.z = 200



  var cam_mat = new THREE.MeshBasicMaterial({color: 0xff0000})
  var cam_geom = new THREE.SphereGeometry(4, 15, 15)


  camera = new THREE.Mesh(cam_geom, cam_mat)
  scene.add(camera)

}

// var camera = new THREE.OrthographicCamera(window.innerWidth/-2, window.innerWidth/2, window.innerHeight/2, window.innerHeight/-2, 1, 1000)


const CAM_RADIUS = 400


camera.position.z = 50
camera.position.x = CAM_RADIUS

camera.rotation.y = Math.PI / 2
camera.rotation.x = Math.PI / 2

var renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// var axesHelper = new THREE.AxesHelper(50)
// scene.add(axesHelper)

const BOID_COUNT = 100;
const visualRange = 40;

var boid_geom = new THREE.SphereGeometry(4, 15, 15)
var boid_mat = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff})

var boids = []

function init_boids() {
  for (i=0;i<BOID_COUNT;i++) {
    var boid = new THREE.Mesh(boid_geom, boid_mat)

    boid.position.x = (Math.random()-0.5) * window.innerWidth/6
    boid.position.y = (Math.random()-0.5) * window.innerHeight/6

    boid.velocity = new THREE.Vector3()
    boid.velocity.x = Math.random() * 10 - 5
    boid.velocity.y = Math.random() * 10 - 5

    boids.push(boid)
    scene.add(boid)
  }
}

function distance(boid1, boid2) {
  var temp = boid1.position.clone()
  temp.sub(boid2.position)
  var dist = temp.length()
  temp = null
  return dist
}

function nClosestBoids(boid, n) {
  const sorted = boids.slice()
  sorted.sort((a, b) => distance(boid, a) - distance(boid, b))
  return sorted.slice(1, n+1);
}

function keepWithinBounds(boid) {
  const margin = 50
  const turnFactor = 1

  if (boid.position.x < -window.innerWidth/2 + margin) {
    boid.velocity.x += turnFactor
  }
  if (boid.position.x > window.innerWidth/2 - margin) {
    boid.velocity.x -= turnFactor
  }
  if (boid.position.y < -window.innerHeight/2 + margin) {
    boid.velocity.y += turnFactor
  }
  if (boid.position.y > window.innerHeight/2 - margin) {
    boid.velocity.y -= turnFactor
  }
}

function flyTowardsCenter(boid) {
  const centeringFactor = 0.005

  let center = new THREE.Vector3()
  let numNeighbors = 0

  for (let otherBoid of boids) {
    if (distance(boid, otherBoid) < visualRange) {
      center.x += otherBoid.position.x
      center.y += otherBoid.position.y

      numNeighbors += 1
    }
  }

  if (numNeighbors > 0) {
    center.divideScalar(numNeighbors)
    center.sub(boid.position)
    center.multiplyScalar(centeringFactor)

    boid.velocity.add(center)
  }
}

function avoidOthers(boid) {
  const minDistance = 10
  const avoidFactor = 0.05

  let move = new THREE.Vector3()
  for (let otherBoid of boids) {
    if (otherBoid !== boid) {
      if (distance(boid, otherBoid) < minDistance) {
        let temp = boid.position.clone()
        temp.sub(otherBoid.position)

        move.add(temp)
        temp = null
      }
    }
  }

  move.multiplyScalar(avoidFactor)
  boid.velocity.add(move)
}

function matchVelocity(boid) {
  const matchingFactor = 0.05

  let avg = new THREE.Vector3()
  let numNeighbors = 0

  for (let otherBoid of boids) {
    if (distance(boid, otherBoid) < visualRange) {
      avg.add(otherBoid.velocity)
      numNeighbors += 1
    }
  }

  if (numNeighbors > 0) {
    avg.divideScalar(numNeighbors)
    avg.sub(boid.velocity)
    avg.multiplyScalar(matchingFactor)

    boid.velocity.add(avg)
  }
}

function limitSpeed(boid) {
  const speedLimit = 10

  const speed = boid.velocity.length()

  if (speed > speedLimit) {
    boid.velocity.divideScalar(speed)
    boid.velocity.multiplyScalar(speedLimit)
  }
}

var theta = 0

function moveCam() {

  camera.position.x = CAM_RADIUS * Math.cos(theta)
  camera.position.y = CAM_RADIUS * Math.sin(theta)

  camera.rotation.y = Math.PI/2 + theta

  theta += 0.01
}

function time_step() {
    for (let boid of boids) {
      flyTowardsCenter(boid)
      avoidOthers(boid)
      matchVelocity(boid)
      limitSpeed(boid)
      keepWithinBounds(boid)

      boid.position.add(boid.velocity)
    }

    moveCam()

    requestAnimationFrame(time_step)
    if (O_CAM)
      renderer.render(scene, camera_o)
    else
      renderer.render(scene, camera)
    // renderer.render(scene, camera_o)
}
init_boids()
time_step()
