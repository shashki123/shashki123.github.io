class Piece {
	constructor(color, isQuin, row, col) {
		color == 'up' ? (this.color = 'green') : (this.color = 'white')

		this.row = row
		this.col = col
		this.isQuin = isQuin
		this.isUp = color == 'up'
		this.isDown = color == 'down'

		this.element = this.createElement(row, col)
	}

	createElement(row, col) {
		const element = document.createElement('div')

		// element.classList.add('piece', this.color)
		if (this.isQuin) {
			element.classList.add('quine')
		}

		element.classList.add('piece', this.color)

		element.dataset.row = row
		element.dataset.col = col
		return element
	}

	updateCoords(row, col) {
		this.row = row
		this.col = col
		this.element.dataset.row = row
		this.element.dataset.col = col
	}
}

// class Quine extends Piece {
//   check
// }

class Cell {
	constructor(row, col, isPlayable) {
		this.isPlayable = isPlayable
		this.piece = null
		this.row = row
		this.col = col

		this.element = this.createElement(row, col)

		this.styleCell(isPlayable)
	}

	createElement(row, col) {
		const element = document.createElement('div')
		element.classList.add('cell')
		element.dataset.row = row
		element.dataset.col = col
		return element
	}

	styleCell(isPlayable) {
		isPlayable
			? this.element.classList.add('black')
			: this.element.classList.add('gray')
	}

	lightCell() {
		this.element.classList.add('lightCell')
	}

	unLightCell() {
		this.element.classList.remove('lightCell')
		this.element.classList.remove('gold')
		this.element.classList.remove('radarLightDown')
		this.element.classList.remove('radarLightUp')
		this.element.classList.remove('killingLight')
	}

	placePiece(piece) {
		this.piece = piece
		this.element.appendChild(piece.element)
	}

	isEmpty() {
		return this.piece === null
	}

	removePiece() {
		this.piece = null
		this.element.innerHTML = ''
	}

	hasEnemyPiece(color) {
		return this.piece && this.piece.color != color
	}
}

class Board {
	constructor() {
		this.size = 8
		this.cells = []
		this.lightCells = []
		this.selectedPiece = null
		this.move = 0
		this.isDownMove = true
		this.isUpMove = false
		this.countUpKills = 0
		this.countDownKills = 0
		this.init()
	}

	init() {
		const boardEl = document.querySelector('.board')

		this.createBoard(boardEl)

		boardEl.addEventListener('click', e => this.handleClick(e))
	}

	// createBoard(boardEl) {
	// 	for (let row = 0; row < this.size; row++) {
	// 		const rowArray = []
	// 		for (let col = 0; col < this.size; col++) {
	// 			const cell = new Cell(row, col, (row + col) % 2 === 1)
	// 			rowArray.push(cell)
	// 			boardEl.appendChild(cell.element)

	// 			if (cell.isPlayable && (row < 3 || row > 4)) {

	// 				const	piece = new Piece(row < 3 ? 'up' : 'down', false, row, col)

	// 				this.addPiece(piece, cell)
	// 			}
	// 		}
	// 		this.cells.push(rowArray)
	// 	}
	// }

	createBoard(boardEl) {
		for (let row = 0; row < this.size; row++) {
			const rowArray = []
			for (let col = 0; col < this.size; col++) {
				const cell = new Cell(row, col, (row + col) % 2 === 1)
				rowArray.push(cell)
				boardEl.appendChild(cell.element)

				if (cell.isPlayable && (row < 3 || row > 4)) {
					let piece
					if (row == 5 && col == 4) {
						piece = new Piece(row < 3 ? 'up' : 'down', true, row, col)
					} else if (row == 2 && col == 1) {
						piece = new Piece(row < 3 ? 'up' : 'down', true, row, col)
					} else {
						piece = new Piece(row < 3 ? 'up' : 'down', false, row, col)
					}
					// const piece = new Piece(row < 3 ? 'up' : 'down', false, row, col)

					this.addPiece(piece, cell)
				}
			}
			this.cells.push(rowArray)
		}
	}

	changeMove() {
		this.move = this.move == 0 ? 1 : 0
		this.isDownMove = this.move == 0
		this.isUpMove = this.move == 1

		document.querySelector('.moveBoard').classList.toggle('green')
	}

	isCorrectMove(piece) {
		if (piece)
			return (piece.isDown && this.isDownMove) || (piece.isUp && this.isUpMove)
	}

	isEnemy(piece) {
		if (piece)
			return !(piece.isDown && this.isDownMove) || (piece.isUp && this.isUpMove)
	}

	addPiece(piece, cell) {
		cell.placePiece(piece)
	}

	movePiece(piece, targetCell) {
		const oldCell = this.cells[piece.row][piece.col]

		oldCell.removePiece()

		targetCell.placePiece(piece)
		piece.updateCoords(targetCell.row, targetCell.col)
	}

	selectPiece(cell) {
		if (cell.piece && this.isCorrectMove(cell.piece)) {
			// выбор шашки
			this.selectedPiece = cell.piece
			this.selectedPiece.element.classList.add('selected_piece')
			this.lightKills(cell)

			if (cell.piece.isQuin) {
				const mustableKills = this.scanForMustKillsQuine(this.selectedPiece)
				this.quineLightKills(mustableKills)
			}
		}
	}

	deselectPiece() {
		if (this.selectedPiece) {
			this.selectedPiece.element.classList.remove('selected_piece')
			this.selectedPiece = null
		}
	}

	canMoveTo(cell) {
		const rowDiff = cell.row - this.selectedPiece.row
		const colDiff = cell.col - this.selectedPiece.col

		if (Math.abs(rowDiff) == 1 && Math.abs(colDiff) == 1) {
			return (
				(this.selectedPiece.isDown && rowDiff < 0) ||
				(this.selectedPiece.isUp && rowDiff > 0)
			)
		}
		return false
	}

	killPiece(cell, startCell = null) {
		let middleCell
		if (!startCell) {
			const rowDiff = cell.row - this.selectedPiece.row
			const colDiff = cell.col - this.selectedPiece.col
			const midRow = this.selectedPiece.row + rowDiff / 2
			const midCol = this.selectedPiece.col + colDiff / 2
			middleCell = this.cells[midRow][midCol]
		} else {
			const rowDiff = cell.row - startCell.row
			const colDiff = cell.col - startCell.col
			const midRow = startCell.row + rowDiff / 2
			const midCol = startCell.col + colDiff / 2
			middleCell = this.cells[midRow][midCol]
		}

		middleCell.removePiece()
		//считаем килы
		if (this.selectedPiece.isDown) {
			this.countDownKills++
			console.log('piece | down Kills = ', this.countDownKills)
		} else if (this.selectedPiece.isUp) {
			this.countUpKills++
			console.log('piece | up Kills = ', this.countUpKills)
		}
	}

	findMustableKillingCells() {
		let mustableKillingCells = []
		for (let cells of this.cells) {
			cells.forEach(cell => {
				if (cell.piece?.isQuin && this.isCorrectMove(cell.piece)) {
					const bigRadar = this.scanForMustKillsQuine(cell)
					if (bigRadar.length > 0) {
						mustableKillingCells.push({ row: cell.row, col: cell.col })
					}
				}

				if (this.isCorrectMove(cell.piece) && this.canKillSomeone(cell)) {
					mustableKillingCells.push({ row: cell.row, col: cell.col })
				}
			})
		}
		return mustableKillingCells
	}

	canKillSomeone(currentCell) {
		const potentialKills = [
			{ row: currentCell.row + 2, col: currentCell.col + 2 },
			{ row: currentCell.row - 2, col: currentCell.col + 2 },
			{ row: currentCell.row + 2, col: currentCell.col - 2 },
			{ row: currentCell.row - 2, col: currentCell.col - 2 },
		]

		for (let target of potentialKills) {
			if (
				target.row >= 0 &&
				target.row < this.size &&
				target.col >= 0 &&
				target.col < this.size
			) {
				const targetCell = this.cells[target.row][target.col]
				if (this.canMoveWithKill(currentCell, targetCell)) {
					return true
				}
			}
		}

		return false
	}

	canMoveWithKill(currentCell, cell) {
		if (!currentCell) {
			const rowDiff = cell.row - this.selectedPiece.row
			const colDiff = cell.col - this.selectedPiece.col

			if (Math.abs(rowDiff) == 2 && Math.abs(colDiff) == 2) {
				const midRow = this.selectedPiece.row + rowDiff / 2
				const midCol = this.selectedPiece.col + colDiff / 2
				const middleCell = this.cells[midRow][midCol]

				return (
					middleCell.hasEnemyPiece(this.selectedPiece.color) && cell.isEmpty()
				)
			} else return false
		} else {
			const rowDiff = cell.row - currentCell.row
			const colDiff = cell.col - currentCell.col

			if (Math.abs(rowDiff) == 2 && Math.abs(colDiff) == 2) {
				const midRow = currentCell.row + rowDiff / 2
				const midCol = currentCell.col + colDiff / 2
				const middleCell = this.cells[midRow][midCol]

				return (
					currentCell.piece &&
					middleCell.piece &&
					middleCell.hasEnemyPiece(currentCell.piece.color) &&
					cell.isEmpty()
				)
			}
			return false
		}
	}

	canCooKill(currentCell) {
		const potentialKills = [
			{ row: currentCell.row + 2, col: currentCell.col + 2 },
			{ row: currentCell.row - 2, col: currentCell.col + 2 },
			{ row: currentCell.row + 2, col: currentCell.col - 2 },
			{ row: currentCell.row - 2, col: currentCell.col - 2 },
		]

		for (let target of potentialKills) {
			if (
				target.row >= 0 &&
				target.row < this.size &&
				target.col >= 0 &&
				target.col < this.size
			) {
				const targetCell = this.cells[target.row][target.col]
				if (this.canMoveWithKill(currentCell, targetCell)) {
					return true
				}
			}
		}
		return false
	}

	lightKills(currentCell) {
		const potentialKills = [
			{ row: currentCell.row + 2, col: currentCell.col + 2 },
			{ row: currentCell.row - 2, col: currentCell.col + 2 },
			{ row: currentCell.row + 2, col: currentCell.col - 2 },
			{ row: currentCell.row - 2, col: currentCell.col - 2 },
		]
		const middleKills = [
			{ row: currentCell.row + 1, col: currentCell.col + 1 },
			{ row: currentCell.row - 1, col: currentCell.col + 1 },
			{ row: currentCell.row + 1, col: currentCell.col - 1 },
			{ row: currentCell.row - 1, col: currentCell.col - 1 },
		]

		potentialKills.forEach((target, index) => {
			if (
				target.row >= 0 &&
				target.row < this.size &&
				target.col >= 0 &&
				target.col < this.size
			) {
				const targetCell = this.cells[target.row][target.col]
				if (this.canMoveWithKill(currentCell, targetCell)) {
					targetCell.lightCell()
					const middleCell =
						this.cells[middleKills[index].row][middleKills[index].col]
					this.lightRedKills(middleCell)
					this.lightCells.push({ row: target.row, col: target.col })
				}
			}
		})
	}

	lightRedKills(cell) {
		cell.element.classList.add('killingLight')
		this.lightCells.push({ row: cell.row, col: cell.col })
	}

	lightMustableCells(arrOfMustableCells) {
		arrOfMustableCells.forEach(coords => {
			const cell = this.cells[coords.row][coords.col]
			cell.element.classList.add('gold')
			this.lightCells.push({ row: cell.row, col: cell.col })
		})
	}

	clearLights() {
		for (let light of this.lightCells) {
			this.cells[light.row][light.col].unLightCell()
		}
		this.lightCells = []
	}

	dontTouchIfHaveMustableIncapsulateLogic(cell) {
		let FlagAtLeastOneSame = false

		const MustKillArray = this.findMustableKillingCells()

		if (MustKillArray.length > 0) {
			MustKillArray.forEach(item => {
				if (
					this.isCorrectMove(cell.piece) &&
					item.col == cell.col &&
					item.row == cell.row
				) {
					FlagAtLeastOneSame = true
				}
			})

			if (!FlagAtLeastOneSame) {
				this.lightMustableCells(MustKillArray)
				console.log('WRONG')
				this.deselectPiece()
				return
			}
		}
	}

	tryBecameQuine() {
		if ((this.selectedPiece.row == 0 || this.selectedPiece.row == 7) && !this.selectedPiece.isQuin) {
			const selectedCell =
				this.cells[this.selectedPiece.row][this.selectedPiece.col]
			selectedCell.removePiece()
			const piece = new Piece(
				this.selectedPiece.isUp ? 'up' : 'down',
				true,
				this.selectedPiece.row,
				this.selectedPiece.col
			)
			console.log('is UPPPPP', this.selectedPiece.isUp)
			selectedCell.placePiece(piece)
			this.selectedPiece = piece
			console.log('Quine Became ', this.selectedPiece)
		}
	}

	isGreenLightCell(cell) {
		let flag = false
		this.lightCells.forEach(el => {
			if (el.row == cell.row && el.col == cell.col) {
				const tryGreenCell = this.cells[el.row][el.col]
				if (tryGreenCell.element.classList.contains('lightCell')) {
					flag = true
				}
			}
		})

		return flag
	}

	handlePieceMove(cell) {
		if (this.lightCells.length > 0 && !this.isGreenLightCell(cell)) {
			this.deselectPiece()
			this.clearLights()
			return
		}

		if (cell.isPlayable && cell.isEmpty()) {
			if (this.canMoveTo(cell)) {
				this.movePiece(this.selectedPiece, cell)
				this.tryBecameQuine()
				this.deselectPiece()
				this.changeMove()
				return
			} else if (this.canMoveWithKill(null, cell)) {
				this.killPiece(cell)
				this.movePiece(this.selectedPiece, cell)
				this.tryBecameQuine()
				this.clearLights()
				this.tryWin()
				if (this.canCooKill(cell)) {
					this.lightKills(cell)
				} else this.changeMove()
			}
		}
		if (!this.canCooKill(cell)) {
			this.deselectPiece()
			this.clearLights()
		}
	}

	handleQuineMove(cell) {
		const mustableKills = this.scanForMustKillsQuine(this.selectedPiece)

		if (
			mustableKills.length > 0 &&
			!this.quineIsCellToKill(cell, mustableKills)
		) {
			this.deselectPiece()
			console.log('LIGHT CELLS', this.lightCells)
			this.clearLights()
			return
		}
		if (cell.isPlayable && cell.isEmpty()) {
			if (this.quineCanMoveTo(cell)) {
				this.movePiece(this.selectedPiece, cell)
				this.deselectPiece()
				this.changeMove()
				this.clearLights()
				return
			} else if (this.quineCanMoveWithKill(cell, mustableKills)) {
				this.quineKillPiece(cell, mustableKills)
				this.movePiece(this.selectedPiece, cell)
				this.clearLights()
				this.tryWin()
				if (this.quineCanCooKill(cell)) {
					this.lightKills(cell)
				} else this.changeMove()
			}
		}
		if (!this.quineCanCooKill(cell)) {
			this.deselectPiece()
			this.clearLights()
		}
	}

	handleClick(e) {
		const cellEl = e.target.closest('.cell')
		if (!cellEl) return

		const cell = this.cells[cellEl.dataset.row][cellEl.dataset.col]

		if (this.selectedPiece) {
			this.selectedPiece.isQuin
				? this.handleQuineMove(cell)
				: this.handlePieceMove(cell)
		} else {
			this.clearLights()
			this.selectPiece(cell)
			if (cell.piece?.isQuin) {
				this.scanRadarColor(this.selectedPiece)
				if (this.atLeastOneWantToKillAccordingToThisLights()) {
					this.clearRadarLights()
				}
			}
			this.dontTouchIfHaveMustableIncapsulateLogic(cell)
		}
	}

	//quine

	doQuineRadarRU(quineCell) {
		if (quineCell) {
			let radar = []
			let tryCell = { row: quineCell.row - 1, col: quineCell.col + 1 }

			while (
				tryCell.row >= 0 &&
				tryCell.row < this.size &&
				tryCell.col >= 0 &&
				tryCell.col < this.size
			) {
				const cell = this.cells[tryCell.row][tryCell.col]
				if (cell.piece && this.isCorrectMove(cell.piece)) return radar
				radar.push(cell)
				tryCell.row -= 1
				tryCell.col += 1
				if (cell.piece) return radar
			}
			return radar
		}
		return []
	}
	doQuineRadarRD(quineCell) {
		if (quineCell) {
			let radar = []
			let tryCell = { row: quineCell.row + 1, col: quineCell.col + 1 }

			while (
				tryCell.row >= 0 &&
				tryCell.row < this.size &&
				tryCell.col >= 0 &&
				tryCell.col < this.size
			) {
				const cell = this.cells[tryCell.row][tryCell.col]
				if (cell.piece && this.isCorrectMove(cell.piece)) return radar
				radar.push(cell)
				tryCell.row += 1
				tryCell.col += 1
				if (cell.piece) return radar
			}
			return radar
		}
		return []
	}
	doQuineRadarLU(quineCell) {
		if (quineCell) {
			let radar = []
			let tryCell = { row: quineCell.row - 1, col: quineCell.col - 1 }

			while (
				tryCell.row >= 0 &&
				tryCell.row < this.size &&
				tryCell.col >= 0 &&
				tryCell.col < this.size
			) {
				const cell = this.cells[tryCell.row][tryCell.col]
				if (cell.piece && this.isCorrectMove(cell.piece)) return radar
				radar.push(cell)
				tryCell.row -= 1
				tryCell.col -= 1
				if (cell.piece) return radar
			}
			return radar
		}
		return []
	}
	doQuineRadarLD(quineCell) {
		if (quineCell) {
			let radar = []
			let tryCell = { row: quineCell.row + 1, col: quineCell.col - 1 }

			while (
				tryCell.row >= 0 &&
				tryCell.row < this.size &&
				tryCell.col >= 0 &&
				tryCell.col < this.size
			) {
				const cell = this.cells[tryCell.row][tryCell.col]
				if (cell.piece && this.isCorrectMove(cell.piece)) return radar
				radar.push(cell)
				tryCell.row += 1
				tryCell.col -= 1
				if (cell.piece) return radar
			}
			return radar
		}
		return []
	}

	findRadarOrientation(cell) {
		let quinCell = this.selectedPiece

		// RU
		if (quinCell.row > cell.row && quinCell.col < cell.col) {
			return ['RU', this.doQuineRadarRU(this.cells[quinCell.row][quinCell.col])]
		}
		// RD
		else if (quinCell.row < cell.row && quinCell.col < cell.col) {
			return ['RD', this.doQuineRadarRD(this.cells[quinCell.row][quinCell.col])]
		}
		// LU
		else if (quinCell.row > cell.row && quinCell.col > cell.col) {
			return ['LU', this.doQuineRadarLU(this.cells[quinCell.row][quinCell.col])]
		}
		// LD
		else if (quinCell.row < cell.row && quinCell.col > cell.col) {
			return ['LD', this.doQuineRadarLD(this.cells[quinCell.row][quinCell.col])]
		}
		return [[], []]
	}

	isNotOutOfBounce(target) {
		return (
			target.row >= 0 &&
			target.row < this.size &&
			target.col >= 0 &&
			target.col < this.size
		)
	}

	scanForMustKillsQuine(quineCell) {
		const MustableKills = []

		const lastLD = this.doQuineRadarLD(quineCell)?.at(-1)
		const lastLU = this.doQuineRadarLU(quineCell)?.at(-1)
		const lastRD = this.doQuineRadarRD(quineCell)?.at(-1)
		const lastRU = this.doQuineRadarRU(quineCell)?.at(-1)

		const prevLD = this.doQuineRadarLD(quineCell)?.at(-2)
			? this.doQuineRadarLD(quineCell)?.at(-2)
			: quineCell
		const prevLU = this.doQuineRadarLU(quineCell)?.at(-2)
			? this.doQuineRadarLU(quineCell)?.at(-2)
			: quineCell
		const prevRD = this.doQuineRadarRD(quineCell)?.at(-2)
			? this.doQuineRadarRD(quineCell)?.at(-2)
			: quineCell
		const prevRU = this.doQuineRadarRU(quineCell)?.at(-2)
			? this.doQuineRadarRU(quineCell)?.at(-2)
			: quineCell

		let nextLD = { row: lastLD?.row + 1, col: lastLD?.col - 1 }
		let nextLU = { row: lastLU?.row - 1, col: lastLU?.col - 1 }
		let nextRD = { row: lastRD?.row + 1, col: lastRD?.col + 1 }
		let nextRU = { row: lastRU?.row - 1, col: lastRU?.col + 1 }

		if (this.isNotOutOfBounce(nextLD)) {
			nextLD = this.cells[nextLD.row][nextLD.col]
			if (!nextLD.piece) {
				MustableKills.push({
					cell: lastLD,
					nextCell: nextLD,
					prevCell: prevLD,
					dir: 'LD',
				})
			}
		} else
			console.log(
				`element NextLD row = ${nextLD.row} col = ${nextLD.col} is outOfBounce`
			)

		if (this.isNotOutOfBounce(nextLU)) {
			nextLU = this.cells[nextLU.row][nextLU.col]
			if (!nextLU.piece) {
				MustableKills.push({
					cell: lastLU,
					nextCell: nextLU,
					prevCell: prevLU,
					dir: 'LU',
				})
			}
		} else
			console.log(
				`element NextLU row = ${nextLU.row} col = ${nextLU.col} is outOfBounce`
			)

		if (this.isNotOutOfBounce(nextRU)) {
			nextRU = this.cells[nextRU.row][nextRU.col]
			if (!nextRU.piece) {
				MustableKills.push({
					cell: lastRU,
					nextCell: nextRU,
					prevCell: prevRU,
					dir: 'RU',
				})
			}
		} else
			console.log(
				`element NextRU row = ${nextRU.row} col = ${nextRU.col} is outOfBounce`
			)

		if (this.isNotOutOfBounce(nextRD)) {
			nextRD = this.cells[nextRD.row][nextRD.col]
			if (!nextRD.piece) {
				MustableKills.push({
					cell: lastRD,
					nextCell: nextRD,
					prevCell: prevRD,
					dir: 'RD',
				})
			}
		} else
			console.log(
				`element NextRD row = ${nextRD.row} col = ${nextRD.col} is outOfBounce`
			)

		return MustableKills
	}

	scanRadarColor(quineCell) {
		const bigRadar = [
			this.doQuineRadarLD(quineCell),
			this.doQuineRadarLU(quineCell),
			this.doQuineRadarRD(quineCell),
			this.doQuineRadarRU(quineCell),
		]

		bigRadar.forEach(radar => {
			radar.forEach(cell => {
				if (!cell.piece) {
					if (this.selectedPiece.isDown) {
						cell.element.classList.add('radarLightDown')
						this.lightCells.push({ row: cell.row, col: cell.col })
					} else if (this.selectedPiece.isUp) {
						cell.element.classList.add('radarLightUp')
						this.lightCells.push({ row: cell.row, col: cell.col })
					}
				}
			})
		})
	}

	quineCanMoveTo(cell) {
		let flag = false
		const [orientation, radar] = this.findRadarOrientation(cell)
		console.log('Quine Radar = ', radar)
		console.log('selected cell = ', cell)
		radar.forEach(el => {
			console.log(
				el.row,
				cell.row,
				el.col,
				cell.col,
				el.row == cell.row,
				el.col == cell.col
			)
			if (el.row == cell.row && el.col == cell.col) {
				flag = true
			}
		})

		if (flag) return true

		return false
	}

	quineCanMoveWithKill(cell, mustableKills) {
		let answer = false

		mustableKills.forEach(el => {
			if (el.nextCell == cell) {
				answer = el.nextCell.isEmpty()
			}
		})

		return answer
	}

	quineKillPiece(cell, mustableKills) {
		mustableKills.forEach(el => {
			if (el.nextCell == cell) {
				el.cell.removePiece()
				//считаем килы
				if (this.selectedPiece.isDown) {
					this.countDownKills++
					console.log('quine | down Kills = ', this.countDownKills)
				} else if (this.selectedPiece.isUp) {
					this.countUpKills++
					console.log('quine | up Kills = ', this.countUpKills)
				}
			}
		})
	}

	quineCanCooKill(cell) {
		const MustableKills = this.scanForMustKillsQuine(cell)
		if (MustableKills.length === 0) {
			return false
		}
		return true
	}

	quineIsCellToKill(cell, MustableKills) {
		let flag = false
		MustableKills.forEach(el => {
			if (el.nextCell == cell) {
				flag = true
			}
		})

		return flag
	}

	quineLightKills(mustableKills) {
		if (mustableKills.length > 0) {
			mustableKills.forEach(el => {
				el.nextCell.lightCell()
				this.lightRedKills(el.cell)
				this.lightCells.push({ row: el.nextCell.row, col: el.nextCell.col })
			})
		}
	}

	atLeastOneWantToKillAccordingToThisLights() {
		let flag = false
		this.lightCells.forEach(el => {
			const cell = this.cells[el.row][el.col]
			if (cell.element.classList.contains('killingLight')) {
				flag = true
			}
		})
		return flag
	}

	clearRadarLights() {
		this.lightCells.forEach(el => {
			const cell = this.cells[el.row][el.col]
			if (
				cell.element.classList.contains('radarLightUp') ||
				cell.element.classList.contains('radarLightDown')
			) {
				cell.unLightCell()
			}
		})
	}

	tryWin() {
		if (this.countDownKills == 12) {
			alert('Победили нижние')
			return
		}
		if (this.countUpKills == 12) {
			alert('Победили верхние')
			return
		}
	}
}
new Board()

// убирать подсветку хода дамки, если дамка обязана удраить
//добавить выйгрышь
