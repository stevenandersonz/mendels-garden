(function (global) {
  let plantCount = 0;
  /*
    Uppercase alleles -> Dominant Gene
    Lowercase alleles -> Recesive Gene
    Tt -> heterozygous
    TT -> homozygous

    genotype -> what I've available from parents
    phenotype -> what I actually have 

    Possible values for each trait in pea plant:
    stem: tall (T) , short (t)
    seedTexture: smooth (S), wrinkled (s)
    seedColor: yellow (Y), green (y)
    flowerColor: purple (P), white (p)
    podColor: green (G), yellow (g)

  */
  function calculateSingleTrait(genotype1, genotype2) {
    let combinations = [];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        let allele1 = genotype1[i];
        let allele2 = genotype2[j];
        // Ensure that the dominant allele is always first
        if (
          allele1.toLowerCase() === allele1 &&
          allele2.toUpperCase() === allele2
        ) {
          combinations.push(allele2 + allele1);
        } else {
          combinations.push(allele1 + allele2);
        }
      }
    }
    return combinations;
  }
  function concatenateColumns(arr) {
    const numRows = arr.length;
    const numCols = arr[0].length;
    let result = [];

    for (let col = 0; col < numCols; col++) {
      let columnConcatenation = "";

      for (let row = 0; row < numRows; row++) {
        columnConcatenation += arr[row][col];
      }

      result.push(columnConcatenation);
    }

    return result;
  }
  function selectItemByRatio(arr) {
    const itemsWithRatio = arr.map((item) => ({
      value: item,
      ratio: item.length,
    }));
    const ratioSum = itemsWithRatio.reduce((sum, item) => sum + item.ratio, 0);

    const randomValue = Math.random() * ratioSum;
    let currentSum = 0;

    for (let i = 0; i < itemsWithRatio.length; i++) {
      const currentItem = itemsWithRatio[i];
      currentSum += currentItem.ratio;

      if (randomValue <= currentSum) {
        return currentItem.value;
      }
    }

    // Fallback: return the last item's value if no item is selected
    return itemsWithRatio[itemsWithRatio.length - 1].value;
  }
  // ParentA && ParentB only for genealogical purposes
  function PeaPlant(phenotype = null, parentA = null, parentB = null) {
    this.id = plantCount++;
    this.phenotype = phenotype;
    this.parentA = parentA;
    this.parentB = parentB;
    this.coord = null;
  }
  const map2traits = {
    T: "tall",
    t: "short",
    S: "smooth",
    s: "wrinkled",
    Y: "yellow",
    y: "green",
    P: "purple",
    p: "white",
    G: "green",
    g: "yellow",
  };
  PeaPlant.prototype = {
    // Five trait Punnett square calculator
    findGenotypes(otherPea) {
      let results = [];
      for (let i = 0; i < 10; i += 2) {
        results.push(
          calculateSingleTrait(
            this.phenotype.slice(i, i + 2),
            otherPea.phenotype.slice(i, i + 2)
          )
        );
      }
      return concatenateColumns(results);
    },
    breed: function (otherPea) {
      let genotypes = this.findGenotypes(otherPea);
      console.log(genotypes);
      let phenotype = selectItemByRatio(genotypes);
      console.log(phenotype);
      let newPea = new PeaPlant(phenotype.split(""));
      return newPea;
    },
    info: function () {
      return `
        genotype: ${this.phenotype}
        Stem: ${map2traits[this.phenotype[0]]}
        Seed Texture: ${map2traits[this.phenotype[2]]}
        Seed Color: ${map2traits[this.phenotype[4]]}
        Flower Color: ${map2traits[this.phenotype[6]]}
        Pod Color: ${map2traits[this.phenotype[8]]}
        `;
    },
  };
  function Field(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.plantation = [];
    this.next = [0, 0];
    this.selected = null;
    for (let i = 0; i < this.rows; i++) {
      let row = new Array(this.cols).fill(null);
      this.plantation.push(row);
    }
  }
  Field.prototype = {
    plant: function (peaPlant) {
      const [row, col] = this.next;
      if (row >= this.rows) throw Error("field is full");
      this.plantation[row][col] = peaPlant;
      peaPlant.coord = [row, col];
      if (++this.next[1] % this.cols === 0) {
        this.next = [row + 1, 0];
      }
      return [row, col];
    },
    getPea: function (coord) {
      if (!Array.isArray(coord))
        throw new Error("Coords must be array: [row,col]");
      let [row, col] = coord;
      return this.plantation[row][col];
    },
  };

  global.PeaPlant = PeaPlant;
  global.Field = Field;
})(window);

window.addEventListener("load", function () {
  const field = new Field(2, 5);
  document
    .getElementById("plant-generator")
    .addEventListener("submit", function (event) {
      // Add Genesis Seed into inventory
      // Genesis Seed (both alleles are the same)
      // SS or ss can't be sS
      event.preventDefault();
      const peaData = new FormData(this);
      const phenotype = [];
      for (let [name, value] of peaData)
        for (let i = 0; i < 2; i++) phenotype.push(value);

      // Get selected trait type
      let peaPlant = new PeaPlant(phenotype.join(""));
      let [row, col] = field.plant(peaPlant);
      addToInventory(row, col, peaPlant.phenotype);
    });
  document
    .getElementById("breeder")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      // Breed two pea plants and variants into inventory
      const pea1Coord = document.getElementById("pea-plant1").value.split("-");
      const pea2Coord = document.getElementById("pea-plant2").value.split("-");
      const breedTimes = event.submitter.id.split("-")[2];
      const pea1 = field.getPea(pea1Coord);
      const pea2 = field.getPea(pea2Coord);
      let results = {};
      for (let i = 0; i < breedTimes; i++) {
        let newPea = pea1.breed(pea2);
        let phenotype = newPea.phenotype.join("");
        if (results[phenotype]) results[phenotype] += 1;
        else results[phenotype] = 1;
      }
      document.getElementById("result").innerText = JSON.stringify(results);
      Object.keys(results).forEach((phenotype) => {
        console.log(phenotype);
        let newPea = new PeaPlant(phenotype, pea1, pea2);
        let [row, col] = field.plant(newPea);
        addToInventory(row, col, newPea.phenotype);
      });
    });

  document.querySelectorAll(".cell").forEach((cell) =>
    cell.addEventListener("click", (evt) => {
      let { id } = evt.target;
      let [_, row, col] = id.split("-");
      const pea = field.getPea([row, col]);

      if (field.selected) {
        const { coord } = field.selected;
        if (coord[0] == row && coord[1] == col) {
          cell.classList.remove("selected");
          field.selected = null;
        } else if (pea) {
          const selectedCell = document.getElementById(
            `plant-${coord[0]}-${coord[1]}`
          );
          selectedCell.classList.remove("selected");
          field.selected = pea;
          cell.classList.add("selected");
        }
      } else if (pea) {
        field.selected = pea;
        cell.classList.add("selected");
      }
      updatePeaInfo(pea.info());
    })
  );
});
function updatePeaInfo(info) {
  document.getElementById("pea-detail").innerText = info;
}
function addToInventory(row, col, info) {
  let cell = document.getElementById(`plant-${row}-${col}`);
  cell.innerText = ` (${row},${col})
  ${info}`;
  cell.classList.add("highlight");
  let select1 = document.getElementById(`pea-plant1`);
  let option = document.createElement("option");
  option.value = `${row}-${col}`;
  option.innerText = `row: ${row} - col: ${col}`;
  select1.appendChild(option);
  let select2 = document.getElementById(`pea-plant2`);
  option = document.createElement("option");
  option.value = `${row}-${col}`;
  option.innerText = `row: ${row} - col: ${col}`;
  select2.appendChild(option);
}
// Create the grid
let gridContainer = document.getElementById("gridContainer");
for (let i = 0; i < 2; i++) {
  for (let j = 0; j < 5; j++) {
    let cell = document.createElement(`div`);
    cell.id = `plant-${i}-${j}`;
    cell.classList.add("cell");
    gridContainer.appendChild(cell);
  }
}
