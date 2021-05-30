import {ModelDsl} from "../src/metamodel";

export enum Player {
    X = "x",
    O = "o",
}

export enum Turn {
    X = "turn_x",
    O = "turn_o",
}

export enum Move {
    _00 = "00",
    _01 = "01",
    _02 = "02",
    _10 = "10",
    _11 = "11",
    _12 = "12",
    _20 = "20",
    _21 = "21",
    _22 = "22",
};

export function v1(dsl: ModelDsl) {
    const {role, cell, fn} = dsl;

    // Roles
    const roleX = role(Player.X);
    const roleO = role(Player.O);

    // Board
    const p00 = cell(Move._00,1);
    const p01 = cell(Move._01,1);
    const p02 = cell(Move._02,1);

    const p10 = cell(Move._10,1);
    const p11 = cell(Move._11,1);
    const p12 = cell(Move._12,1);

    const p20 = cell(Move._20,1);
    const p21 = cell(Move._21,1);
    const p22 = cell(Move._22,1);

    // track alternating turns
    const turnX = cell(Turn.X, 1);
    const turnO = cell(Turn.O, 0);

    // player X moves
    const x00 = fn(Player.X+Move._00, roleX).tx(1, turnO);
    const x01 = fn(Player.X+Move._01, roleX).tx(1, turnO);
    const x02 = fn(Player.X+Move._02, roleX).tx(1, turnO);

    const x10 = fn(Player.X+Move._10, roleX).tx(1, turnO);
    const x11 = fn(Player.X+Move._11, roleX).tx(1, turnO);
    const x12 = fn(Player.X+Move._12, roleX).tx(1, turnO);

    const x20 = fn(Player.X+Move._20, roleX).tx(1, turnO);
    const x21 = fn(Player.X+Move._21, roleX).tx(1, turnO);
    const x22 = fn(Player.X+Move._22, roleX).tx(1, turnO);

    // player O moves
    const o00 = fn(Player.O+Move._00, roleO).tx(1, turnX);
    const o01 = fn(Player.O+Move._01, roleO).tx(1, turnX);
    const o02 = fn(Player.O+Move._02, roleO).tx(1, turnX);

    const o10 = fn(Player.O+Move._10, roleO).tx(1, turnX);
    const o11 = fn(Player.O+Move._11, roleO).tx(1, turnX);
    const o12 = fn(Player.O+Move._12, roleO).tx(1, turnX);

    const o20 = fn(Player.O+Move._20, roleO).tx(1, turnX);
    const o21 = fn(Player.O+Move._21, roleO).tx(1, turnX);
    const o22 = fn(Player.O+Move._22, roleO).tx(1, turnX);

    // change turns when player_x moves
    turnX.tx(1, x00);
    turnX.tx(1, x01);
    turnX.tx(1, x02);

    turnX.tx(1, x10);
    turnX.tx(1, x11);
    turnX.tx(1, x12);

    turnX.tx(1, x20);
    turnX.tx(1, x21);
    turnX.tx(1, x22);

    // remove token from board when player_x moves
    p00.tx(1, x00);
    p01.tx(1, x01);
    p02.tx(1, x02);

    p10.tx(1, x10);
    p11.tx(1, x11);
    p12.tx(1, x12);

    p20.tx(1, x20);
    p21.tx(1, x21);
    p22.tx(1, x22);

    // remove token from board when player_o moves
    p00.tx(1, o00);
    p01.tx(1, o01);
    p02.tx(1, o02);

    p10.tx(1, o10);
    p11.tx(1, o11);
    p12.tx(1, o12);

    p20.tx(1, o20);
    p21.tx(1, o21);
    p22.tx(1, o22);

    // change turns when player_o moves
    turnO.tx(1, o00);
    turnO.tx(1, o01);
    turnO.tx(1, o02);

    turnO.tx(1, o10);
    turnO.tx(1, o11);
    turnO.tx(1, o12);

    turnO.tx(1, o20);
    turnO.tx(1, o21);
    turnO.tx(1, o22);

}
