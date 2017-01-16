const Aviator = (function () {

    const colors = {
        red: 0xf25346,
        white: 0xd8d0d1,
        brown: 0x59332e,
        pink: 0xF5986E,
        brownDark: 0x23190f,
        blue: 0x68c3c0
    };

    let height;
    let width;

    let scene;
    let camera;
    let fieldOfView;
    let aspectRatio;
    let nearPlane;
    let farPlane;

    let renderer;
    let container;

    let hemisphereLight;
    let shadowLight;

    let sea;
    let sky;
    let airplane;

    let mousePosition = {x: 0, y: 0};

    function setup(gameElementId) {
        createScene(gameElementId);
        createLights();

        createPlane();
        createSea();
        createSky();

        document.addEventListener('mousemove', handleMouseMove, false);

        draw();
    }

    function draw() {
        renderer.render(scene, camera);
        updateScene();
        requestAnimationFrame(draw);
    }

    function updateScene() {
        updatePlane();
        sea.moveWaves();
        sea.mesh.rotation.z += .005;
        sky.mesh.rotation.z += .01;
    }

    function createScene(gameElementId) {
        height = window.innerHeight;
        width = window.innerWidth;

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

        aspectRatio = width / height;
        fieldOfView = 60;
        nearPlane = 1;
        farPlane = 10000;
        camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
        camera.position.x = 0;
        camera.position.z = 200;
        camera.position.y = 100;

        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;

        container = document.getElementById(gameElementId);
        container.appendChild(renderer.domElement);

        window.addEventListener('resize', handleWindowResize, false);
    }

    function handleWindowResize() {
        height = window.innerHeight;
        width = window.innerWidth;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    function handleMouseMove(event) {
        const tx = -1 + (event.clientX / width) * 2;
        const ty = 1 - (event.clientY / height) * 2;
        mousePosition = {x: tx, y: ty};
    }

    function updatePlane(){
        const targetY = normalize(mousePosition.y, -.75, .75, 25, 175);
        const targetX = normalize(mousePosition.x, -.75, .75, -100, 100);

        airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * 0.1;
        airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * 0.1;

        airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * 0.0128;
        airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * 0.0064;

        airplane.propeller.rotation.x += 0.3;

        airplane.pilot.updateHairs();
    }

    function normalize(v, vmin, vmax, tmin, tmax) {
        const nv = Math.max(Math.min(v, vmax), vmin);
        const dv = vmax - vmin;
        const pc = (nv - vmin) / dv;
        const dt = tmax - tmin;
        const tv = tmin + (pc * dt);
        return tv;
    }

    function createLights() {

        hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);

        shadowLight = new THREE.DirectionalLight(0xffffff, .9);
        shadowLight.position.set(150, 350, 350);
        shadowLight.castShadow = true;
        shadowLight.shadow.camera.left = -400;
        shadowLight.shadow.camera.right = 400;
        shadowLight.shadow.camera.top = 400;
        shadowLight.shadow.camera.bottom = -400;
        shadowLight.shadow.camera.near = 1;
        shadowLight.shadow.camera.far = 1000;

        shadowLight.shadow.mapSize.width = 2048;
        shadowLight.shadow.mapSize.height = 2048;

        const ambientLight = new THREE.AmbientLight(0xd88a82, 0.25);

        scene.add(ambientLight);
        scene.add(hemisphereLight);
        scene.add(shadowLight);
    }

    function Sea() {

        const geometry = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
        geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

        geometry.mergeVertices();

        for (let vertex of geometry.vertices) {
            vertex.wave = {
                y: vertex.y,
                x: vertex.x,
                z: vertex.z,
                angle: Math.random() * Math.PI * 2,
                amplitude: 5 + Math.random() * 15,
                speed: 0.016 + Math.random() * 0.032
            };
        }

        const material = new THREE.MeshPhongMaterial({
            color: colors.blue,
            transparent: true,
            opacity: .8,
            shading: THREE.FlatShading,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
    }

    Sea.prototype.moveWaves = function () {

        for (let vertex of this.mesh.geometry.vertices) {
            const wave = vertex.wave;

            vertex.x = wave.x + Math.cos(wave.angle) * wave.amplitude;
            vertex.y = wave.y + Math.sin(wave.angle) * wave.amplitude;

            wave.angle += wave.speed;
        }

        this.mesh.geometry.verticesNeedUpdate = true;
        sea.mesh.rotation.z += .005;
    };

    function createSea() {
        sea = new Sea();
        sea.mesh.position.y = -600;
        scene.add(sea.mesh);
    }

    function Cloud() {
        this.mesh = new THREE.Object3D();

        const geometry = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshPhongMaterial({
            color: colors.white,
        });

        const nBlocs = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < nBlocs; i++) {

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = i * 15;
            mesh.position.y = Math.random() * 10;
            mesh.position.z = Math.random() * 10;
            mesh.rotation.z = Math.random() * Math.PI * 2;
            mesh.rotation.y = Math.random() * Math.PI * 2;

            const size = .1 + Math.random() * .9;
            mesh.scale.set(size, size, size);

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            this.mesh.add(mesh);
        }
    }

    function Sky() {
        this.mesh = new THREE.Object3D();
        this.numberOfClouds = 20;

        const stepAngle = Math.PI * 2 / this.numberOfClouds;

        // create the clouds
        for (let i = 0; i < this.numberOfClouds; i++) {
            const cloud = new Cloud();

            const a = stepAngle * i;
            const h = 750 + Math.random() * 200;

            cloud.mesh.position.y = Math.sin(a) * h;
            cloud.mesh.position.x = Math.cos(a) * h;

            cloud.mesh.rotation.z = a + Math.PI / 2;
            cloud.mesh.position.z = -400 - Math.random() * 400;

            const size = 1 + Math.random() * 2;
            cloud.mesh.scale.set(size, size, size);

            this.mesh.add(cloud.mesh);
        }
    }

    function createSky() {
        sky = new Sky();
        sky.mesh.position.y = -600;
        scene.add(sky.mesh);
    }

    function Airplane() {

        this.mesh = new THREE.Object3D();

        const geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
        geomCockpit.vertices[4].y -= 10;
        geomCockpit.vertices[4].z += 20;
        geomCockpit.vertices[5].y -= 10;
        geomCockpit.vertices[5].z -= 20;
        geomCockpit.vertices[6].y += 30;
        geomCockpit.vertices[6].z += 20;
        geomCockpit.vertices[7].y += 30;
        geomCockpit.vertices[7].z -= 20;

        const matCockpit = new THREE.MeshPhongMaterial({color: colors.red, shading: THREE.FlatShading});
        const cockpit = new THREE.Mesh(geomCockpit, matCockpit);
        cockpit.castShadow = true;
        cockpit.receiveShadow = true;
        this.mesh.add(cockpit);

        const geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
        const matEngine = new THREE.MeshPhongMaterial({color: colors.white, shading: THREE.FlatShading});
        const engine = new THREE.Mesh(geomEngine, matEngine);
        engine.position.x = 40;
        engine.castShadow = true;
        engine.receiveShadow = true;
        this.mesh.add(engine);

        const geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
        const matTailPlane = new THREE.MeshPhongMaterial({color: colors.red, shading: THREE.FlatShading});
        const tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
        tailPlane.position.set(-35, 25, 0);
        tailPlane.castShadow = true;
        tailPlane.receiveShadow = true;
        this.mesh.add(tailPlane);

        const geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
        const matSideWing = new THREE.MeshPhongMaterial({color: colors.red, shading: THREE.FlatShading});
        const sideWing = new THREE.Mesh(geomSideWing, matSideWing);
        sideWing.castShadow = true;
        sideWing.receiveShadow = true;
        this.mesh.add(sideWing);

        const geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
        const matPropeller = new THREE.MeshPhongMaterial({color: colors.brown, shading: THREE.FlatShading});
        this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
        this.propeller.castShadow = true;
        this.propeller.receiveShadow = true;

        const geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
        const matBlade = new THREE.MeshPhongMaterial({color: colors.brownDark, shading: THREE.FlatShading});

        const blade = new THREE.Mesh(geomBlade, matBlade);
        blade.position.set(8, 0, 0);
        blade.castShadow = true;
        blade.receiveShadow = true;
        this.propeller.add(blade);
        this.propeller.position.set(50, 0, 0);
        this.mesh.add(this.propeller);

        this.pilot = new Pilot();
        this.pilot.mesh.position.set(-10,27,0);
        this.mesh.add(this.pilot.mesh);
    }

    function createPlane() {
        airplane = new Airplane();
        airplane.mesh.scale.set(.25, .25, .25);
        airplane.mesh.position.y = 100;

        scene.add(airplane.mesh);
    }

    function Pilot() {
        this.mesh = new THREE.Object3D();
        this.mesh.name = "pilot";

        this.angleHairs = 0;

        const bodyGeometry = new THREE.BoxGeometry(15, 15, 15);
        const bodyMaterial = new THREE.MeshPhongMaterial({color: colors.brown, shading: THREE.FlatShading});
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(2, -12, 0);
        this.mesh.add(body);

        const faceGeometry = new THREE.BoxGeometry(10, 10, 10);
        const faceMaterial = new THREE.MeshLambertMaterial({color: colors.pink});
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        this.mesh.add(face);

        const hairGeometry = new THREE.BoxGeometry(4, 4, 4);
        const hairMaterial = new THREE.MeshLambertMaterial({color: colors.brown});
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));

        const hairs = new THREE.Object3D();
        this.hairsTop = new THREE.Object3D();

        for (let i = 0; i < 12; i++) {
            const h = hair.clone();
            const col = i % 3;
            const row = Math.floor(i / 3);
            const startPosZ = -4;
            const startPosX = -4;
            h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
            this.hairsTop.add(h);
        }
        hairs.add(this.hairsTop);

        const hairSideGeometry = new THREE.BoxGeometry(12, 4, 2);
        hairSideGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
        const hairSideRight = new THREE.Mesh(hairSideGeometry, hairMaterial);
        const hairSideLeft = hairSideRight.clone();
        hairSideRight.position.set(8, -2, 6);
        hairSideLeft.position.set(8, -2, -6);
        hairs.add(hairSideRight);
        hairs.add(hairSideLeft);

        const hairbackGeometry = new THREE.BoxGeometry(2, 8, 10);
        const hairBack = new THREE.Mesh(hairbackGeometry, hairMaterial);
        hairBack.position.set(-1, -4, 0);
        hairs.add(hairBack);
        hairs.position.set(-5, 5, 0);

        this.mesh.add(hairs);

        const glassGeometry = new THREE.BoxGeometry(5, 5, 5);
        const glassMaterial = new THREE.MeshLambertMaterial({color: colors.brown});
        const glassRight = new THREE.Mesh(glassGeometry, glassMaterial);
        glassRight.position.set(6, 0, 3);
        const glassLeft = glassRight.clone();
        glassLeft.position.z = -glassRight.position.z;

        const glassAGeom = new THREE.BoxGeometry(11, 1, 11);
        const glassA = new THREE.Mesh(glassAGeom, glassMaterial);
        this.mesh.add(glassRight);
        this.mesh.add(glassLeft);
        this.mesh.add(glassA);

        const earGeometry = new THREE.BoxGeometry(2, 3, 2);
        const earLeft = new THREE.Mesh(earGeometry, faceMaterial);
        earLeft.position.set(0, 0, -6);
        const earRight = earLeft.clone();
        earRight.position.set(0, 0, 6);
        this.mesh.add(earLeft);
        this.mesh.add(earRight);
    }

    Pilot.prototype.updateHairs = function () {
        const hairs = this.hairsTop.children;

        for (let i = 0; i < hairs.length; i++) {
            const h = hairs[i];
            h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
        }
        this.angleHairs += 0.16;
    };

    return {
        setup: setup
    };

})();
