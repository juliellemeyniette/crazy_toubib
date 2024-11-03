"use strict";

// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  BoxGeometry,
  Mesh,
  MeshNormalMaterial,
  AmbientLight,
  Clock
} from 'three';

// If you prefer to import the whole library, with the THREE prefix, use the following line instead:
// import * as THREE from 'three'

// NOTE: three/addons alias is supported by Rollup: you can use it interchangeably with three/examples/jsm/  

// Importing Ammo can be tricky.
// Vite supports webassembly: https://vitejs.dev/guide/features.html#webassembly
// so in theory this should work:
//
// import ammoinit from 'three/addons/libs/ammo.wasm.js?init';
// ammoinit().then((AmmoLib) => {
//  Ammo = AmmoLib.exports.Ammo()
// })
//
// But the Ammo lib bundled with the THREE js examples does not seem to export modules properly.
// A solution is to treat this library as a standalone file and copy it using 'vite-plugin-static-copy'.
// See vite.config.js
// 
// Consider using alternatives like Oimo or cannon-es

import {
  OrbitControls
} from 'three/addons/controls/OrbitControls.js';

import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import * as CANNON from 'cannon-es';
import * as THREE from 'three';


var world;
var dt = 1 / 60;

var constraintDown = false;
var camera, scene, renderer, gplane = false, clickMarker = false;
// DONE : added markerMaterial, or had "undeclared" error
var geometry, material, mesh, markerMaterial;
// DONE : added cubeMesh var, or had "undeclared" error
var cubeMesh;
var controls, time = Date.now();

var jointBody, constrainedBody, mouseConstraint;

var N = 1;

var container, camera, scene, renderer, raycaster;

// To be synced
var meshes = [], bodies = [];
// DONE : added hand model :
var handModel;

// No organ map, so organ like colors
const organMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0.8, 0.2, 0.2),
  roughness: 0.5,
  metalness: 0.2,
  //map: organTexture
});

initCannon();
init();
animate();

function init() {
  // Check for WebGL support 
  // DONE : maybe not usefull
  try {
    renderer = new WebGLRenderer({ antialias: true });
  } catch (error) {
    document.body.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <p>Sorry, your browser does not support WebGL</p>
                    <p>Please try using a modern browser like Chrome, Firefox, or Edge</p>
                </div>
            `;
    return;
  }

  // DONE :Create a Raycaster replacing a projector (WAS depreciated)
  raycaster = new THREE.Raycaster();

  container = document.createElement('div');
  document.body.appendChild(container);

  // scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 500, 10000);

  // camera
  camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.5, 10000);
  camera.position.set(10, 2, 0);
  camera.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  scene.add(camera);

  // lights
  var light, materials;
  scene.add(new THREE.AmbientLight(0x666666));

  light = new THREE.DirectionalLight(0xffffff, 1.75);
  var d = 20;

  light.position.set(d, d, d);

  light.castShadow = true;
  //light.shadowCameraVisible = true;

  // TODO :
  // Adjust lighting
  light.intensity = 1.2;
  light.color.setRGB(1, 0.8, 0.8);

  light.shadowMapWidth = 1024;
  light.shadowMapHeight = 1024;

  light.shadowCameraLeft = -d;
  light.shadowCameraRight = d;
  light.shadowCameraTop = d;
  light.shadowCameraBottom = -d;

  light.shadowCameraFar = 3 * d;
  light.shadowCameraNear = d;
  light.shadowDarkness = 0.5;

  scene.add(light);

  // floor
  geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
  //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
  material = new THREE.MeshLambertMaterial({ color: 0x777777 });
  markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
  //THREE.ColorUtils.adjustHSV( material.color, 0, 0, 0.9 );
  mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  mesh.receiveShadow = true;
  scene.add(mesh);

  // cubes
  var cubeGeo = new THREE.BoxGeometry(1, 1, 1, 10, 10);
  var cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
  for (var i = 0; i < N; i++) {
    cubeMesh = new THREE.Mesh(cubeGeo, organMaterial);
    cubeMesh.castShadow = true;
    meshes.push(cubeMesh);
    scene.add(cubeMesh);
  }

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(scene.fog.color);

  container.appendChild(renderer.domElement);

  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;

  window.addEventListener('resize', onWindowResize, false);

  window.addEventListener("mousemove", onMouseMove, false);
  window.addEventListener("mousedown", onMouseDown, false);
  window.addEventListener("mouseup", onMouseUp, false);

  //DONE : adding hand 
  // // Load hand model
  // const loader = new GLTFLoader();
  // loader.load('hand_low_poly.glb', function (gltf) {
  //   handModel = gltf.scene; // Store the loaded model
  //   handModel.scale.set(1, 8, 8); // Scale the model as needed
  //   scene.add(handModel); // Add it to the scene
  //   console.log('Model loaded:', handModel);

    //DONE : 
    // Call setClickMarker here, after the model has been loaded
  //   setClickMarker(0, 0, 0); // Set the initial position of the click marker
  // }, undefined, function (error) {
  //   console.error('An error happened while loading the model:', error);
  // });
}

function setClickMarker(x, y, z) {
  if (!clickMarker) {
    var handModel = new THREE.SphereGeometry(0.2, 8, 8);
    clickMarker = new THREE.Mesh(handModel, markerMaterial);
    scene.add(clickMarker);
  } else if (!handModel) {
    console.error('handModel is not working, so only red sphere for click marker');
  }
  clickMarker.visible = true;
  clickMarker.position.set(x, y, z);
}

function removeClickMarker() {
  clickMarker.visible = false;
}

function onMouseMove(e) {
  // Move and project on the plane
  if (gplane && mouseConstraint) {
    var pos = projectOntoPlane(e.clientX, e.clientY, gplane, camera);
    if (pos) {
      setClickMarker(pos.x, pos.y, pos.z, scene);
      moveJointToPoint(pos.x, pos.y, pos.z);
    }
  }
}

function onMouseDown(e) {
  // Find mesh from a ray
  var entity = findNearestIntersectingObject(e.clientX, e.clientY, camera, meshes);
  var pos = entity.point;
  if (pos && entity.object.geometry instanceof THREE.BoxGeometry) {
    constraintDown = true;
    // Set marker on contact point
    setClickMarker(pos.x, pos.y, pos.z, scene);

    // Set the movement plane
    setScreenPerpCenter(pos, camera);

    var idx = meshes.indexOf(entity.object);
    if (idx !== -1) {
      addMouseConstraint(pos.x, pos.y, pos.z, bodies[idx]);
    }
  }
}

// This function creates a virtual movement plane for the mouseJoint to move in
function setScreenPerpCenter(point, camera) {
  // If it does not exist, create a new one
  if (!gplane) {
    var planeGeo = new THREE.PlaneGeometry(100, 100);
    var plane = gplane = new THREE.Mesh(planeGeo, material);
    plane.visible = false; // Hide it..
    scene.add(gplane);
  }

  // Center at mouse position
  gplane.position.copy(point);

  // Make it face toward the camera
  gplane.quaternion.copy(camera.quaternion);
}

function onMouseUp(e) {
  constraintDown = false;
  // remove the marker
  removeClickMarker();

  // Send the remove mouse joint to server
  removeJointConstraint();
}

var lastx, lasty, last;
function projectOntoPlane(screenX, screenY, thePlane, camera) {
  var x = screenX;
  var y = screenY;
  var now = new Date().getTime();
  // project mouse to that plane
  var hit = findNearestIntersectingObject(screenX, screenY, camera, [thePlane]);
  lastx = x;
  lasty = y;
  last = now;
  if (hit)
    return hit.point;
  return false;
}

function findNearestIntersectingObject(clientX, clientY, camera, objects) {
  // Get the picking ray from the point
  var raycaster = getRayCasterFromScreenCoord(clientX, clientY, camera);

  // Find the closest intersecting object
  // Now, cast the ray all render objects in the scene to see if they collide. Take the closest one.
  var hits = raycaster.intersectObjects(objects);
  var closest = false;
  if (hits.length > 0) {
    closest = hits[0];
  }
  return closest;
}

// Function that returns a raycaster to use to find intersecting objects
// in a scene given screen pos and a camera
function getRayCasterFromScreenCoord(screenX, screenY, camera) {
  var mouse3D = new THREE.Vector3();
  // Get 3D point from the client x, y
  mouse3D.x = (screenX / window.innerWidth) * 2 - 1;
  mouse3D.y = -(screenY / window.innerHeight) * 2 + 1;
  mouse3D.z = 0.5;

  // Create the raycaster
  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse3D, camera);
  return raycaster;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  //controls.handleResize();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  //controls.update();
  updatePhysics();
  render();
}


function updatePhysics() {
  world.step(dt);
  for (var i = 0; i !== meshes.length; i++) {
    meshes[i].position.copy(bodies[i].position);
    meshes[i].quaternion.copy(bodies[i].quaternion);
  }
}

function render() {
  renderer.render(scene, camera);
}

function initCannon() {
  // Setup our world
  world = new CANNON.World();
  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;
  world.gravity.set(0, -24, 0); // standard earth gravity = -9.8
  world.broadphase = new CANNON.NaiveBroadphase();

  // Create boxes
  var mass = 5, radius = 1.3;
  var boxShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  for (var i = 0; i < N; i++) {
    var boxBody = new CANNON.Body({ mass: mass });
    boxBody.addShape(boxShape);
    boxBody.position.set(0, 5, 0);
    world.addBody(boxBody);
    bodies.push(boxBody);
  }

  // Create a plane
  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({ mass: 0 });
  groundBody.addShape(groundShape);
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(groundBody);

  // Joint body
  var shape = new CANNON.Sphere(0.1);
  jointBody = new CANNON.Body({ mass: 0 });
  jointBody.addShape(shape);
  jointBody.collisionFilterGroup = 0;
  jointBody.collisionFilterMask = 0;
  world.addBody(jointBody)
}

// DONE : var pivot undeclared
var pivot;
function addMouseConstraint(x, y, z, body) {
  // The cannon body constrained by the mouse joint
  constrainedBody = body;

  // Vector to the clicked point, relative to the body
  var v1 = new CANNON.Vec3(x, y, z).vsub(constrainedBody.position);

  // Apply anti-quaternion to vector to tranform it into the local body coordinate system
  var antiRot = constrainedBody.quaternion.inverse();
  pivot = antiRot.vmult(v1); // pivot is not in local body coordinates

  // Move the cannon click marker particle to the click position
  jointBody.position.set(x, y, z);

  // Create a new constraint
  // The pivot for the jointBody is zero
  mouseConstraint = new CANNON.PointToPointConstraint(constrainedBody, pivot, jointBody, new CANNON.Vec3(0, 0, 0));

  // Add the constriant to world
  world.addConstraint(mouseConstraint);
}

// This functions moves the transparent joint body to a new postion in space
function moveJointToPoint(x, y, z) {
  // Move the joint body to a new position
  jointBody.position.set(x, y, z);
  mouseConstraint.update();
}

function removeJointConstraint() {
  // Remove constriant from world
  world.removeConstraint(mouseConstraint);
  mouseConstraint = false;
}

