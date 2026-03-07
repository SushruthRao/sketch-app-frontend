import api from './Api';

export async function getMatchHistory() {
    const response = await api.get('/api/history/matches');
    return response.data;
}

export async function getRoundCanvas(roundRecordId) {
    const response = await api.get(`/api/history/round/${roundRecordId}/canvas`);
    return response.data;
}
