/*
 * buoy.c — Marrowtide IoT mesh buoy firmware (Cortex-M4 target).
 *
 * Build (production):
 *   arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -nostdlib -ffreestanding \
 *                     -Os -fno-toplevel-reorder -o buoy.elf firmware.c
 *   arm-none-eabi-strip --strip-all buoy.elf
 *
 * The Quartermaster's Windows host has no ARM toolchain on PATH; this source
 * is intended for cross-compile from a Linux/WSL build pass. Ship the stripped
 * ELF at challenges/.../files/buoy.elf alongside the four pcaps.
 *
 * Protocol (must match build/make.py exactly):
 *   serialize_packet(payload, payload_len, seq, seed) =
 *     4-byte header [len_lo, len_hi, seq_lo, seq_hi]   (little-endian)
 *     payload XOR rotating_key(seq, seed)
 *
 *   rotating_key(seq, seed):
 *     k = (seed + seq * 0x9E3779B1) & 0xFFFFFFFF      (Knuth multiplicative)
 *     key bytes = k.to_bytes(4, 'little') repeated to payload length
 *
 * Each buoy on the mesh is identified by a 32-bit SEED baked into firmware.
 * The lookup table BUOY_SEEDS below MUST appear in .rodata after compile so
 * a stripped-binary RE pass can locate it. The string identifiers
 * "BUOY_A".."BUOY_D" are placed adjacent so the player can match SEED to name.
 */

#include <stdint.h>
#include <stddef.h>

/* Identifiers — placed adjacent to the seed table for RE correlation. */
const char BUOY_A_NAME[] = "BUOY_A";
const char BUOY_B_NAME[] = "BUOY_B";
const char BUOY_C_NAME[] = "BUOY_C";
const char BUOY_D_NAME[] = "BUOY_D";

const uint32_t BUOY_SEEDS[4] = {
    0xCAFEBABEu,  /* BUOY_A */
    0xDEADBEEFu,  /* BUOY_B */
    0xFACEFEEDu,  /* BUOY_C — ROGUE in this deployment */
    0xBADC0FFEu,  /* BUOY_D */
};

/* serialize_packet: write [4-byte header][XOR'd payload] into out. Returns total length. */
__attribute__((noinline))
size_t serialize_packet(const uint8_t *payload, uint16_t payload_len,
                        uint16_t seq, uint32_t seed, uint8_t *out)
{
    out[0] = (uint8_t)(payload_len & 0xFF);
    out[1] = (uint8_t)((payload_len >> 8) & 0xFF);
    out[2] = (uint8_t)(seq & 0xFF);
    out[3] = (uint8_t)((seq >> 8) & 0xFF);

    uint32_t k = seed + ((uint32_t)seq * 0x9E3779B1u);
    uint8_t key[4] = {
        (uint8_t)(k & 0xFF),
        (uint8_t)((k >> 8) & 0xFF),
        (uint8_t)((k >> 16) & 0xFF),
        (uint8_t)((k >> 24) & 0xFF),
    };

    for (uint16_t i = 0; i < payload_len; i++) {
        out[4 + i] = payload[i] ^ key[i & 3];
    }
    return 4u + (size_t)payload_len;
}

/* deserialize_packet: read [4-byte header][XOR'd payload]. Returns payload bytes
 * written, or 0 on header/length mismatch. seq output via *out_seq. */
__attribute__((noinline))
size_t deserialize_packet(const uint8_t *frame, size_t frame_len,
                          uint32_t seed, uint8_t *out_payload, uint16_t *out_seq)
{
    if (frame_len < 4) return 0;
    uint16_t plen = (uint16_t)frame[0] | ((uint16_t)frame[1] << 8);
    uint16_t seq  = (uint16_t)frame[2] | ((uint16_t)frame[3] << 8);
    if (frame_len != (size_t)(4 + plen)) return 0;

    uint32_t k = seed + ((uint32_t)seq * 0x9E3779B1u);
    uint8_t key[4] = {
        (uint8_t)(k & 0xFF),
        (uint8_t)((k >> 8) & 0xFF),
        (uint8_t)((k >> 16) & 0xFF),
        (uint8_t)((k >> 24) & 0xFF),
    };

    for (uint16_t i = 0; i < plen; i++) {
        out_payload[i] = frame[4 + i] ^ key[i & 3];
    }
    *out_seq = seq;
    return (size_t)plen;
}

/* CRC-8 (poly 0x07, init 0x00) — used as trailer on rogue covert-channel packets. */
__attribute__((noinline))
uint8_t crc8(const uint8_t *data, size_t len)
{
    uint8_t crc = 0;
    for (size_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            if (crc & 0x80) crc = (uint8_t)((crc << 1) ^ 0x07);
            else            crc = (uint8_t)(crc << 1);
        }
    }
    return crc;
}

/* main is intentionally trivial — the interesting bits are above. The build
 * keeps the routines reachable so they survive --strip-all. */
int main(void)
{
    static uint8_t scratch[256];
    static uint8_t out[260];
    /* keep functions live by referencing them */
    serialize_packet(scratch, 16, 0, BUOY_SEEDS[0], out);
    uint16_t s = 0;
    deserialize_packet(out, 20, BUOY_SEEDS[0], scratch, &s);
    (void)crc8(scratch, 16);
    (void)BUOY_A_NAME; (void)BUOY_B_NAME; (void)BUOY_C_NAME; (void)BUOY_D_NAME;
    return 0;
}
